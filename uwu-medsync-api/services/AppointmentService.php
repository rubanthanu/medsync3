<?php
require_once __DIR__ . '/../repositories/AppointmentRepository.php';
require_once __DIR__ . '/../repositories/PatientRepository.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';
require_once __DIR__ . '/../services/NotificationService.php';
require_once __DIR__ . '/../helpers/EmailHelper.php';
require_once __DIR__ . '/../exceptions/AppointmentException.php';
require_once __DIR__ . '/../exceptions/NotFoundException.php';
require_once __DIR__ . '/../exceptions/PermissionException.php';

class AppointmentService {
    private $conn;
    private $appointmentRepo;
    private $patientRepo;
    private $doctorRepo;
    private $notificationService;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->appointmentRepo = new AppointmentRepository($conn);
        $this->patientRepo = new PatientRepository($conn);
        $this->doctorRepo = new DoctorRepository($conn);
        $this->notificationService = new NotificationService($conn);
    }

    public function getWindows($date, $roleId) {
        // Validate date range (today + 2 days only)
        $today = date('Y-m-d');
        $max_date = date('Y-m-d', strtotime('+2 days'));
        if ($date < $today || $date > $max_date) {
            return [];
        }

        // Check if any doctor is available on this date (not on leave)
        $working_doctors = $this->doctorRepo->countWorkingDoctors($date);
        if ($working_doctors == 0) {
            return [];
        }

        $windows = $this->appointmentRepo->getWindows($date);
        $current_time = date('H:i:s');

        $filtered_windows = [];
        foreach ($windows as &$window) {
            $window['available_slots'] = $window['max_slots'] - $window['booked_count'];
            $window['status'] = $window['available_slots'] <= 0 ? 'Full' : 'Available';

            // Patients should not see windows that have already started today.
            if ($roleId == 4 && $date == $today && $window['start_time'] <= $current_time) {
                continue;
            }

            $filtered_windows[] = $window;
        }

        return $filtered_windows;
    }

    public function bookAppointment($userId, $userEmail, $windowId, $appointmentDate) {
        // Get patient_id
        $patient = $this->patientRepo->findByUserId($userId);
        if (!$patient) {
            throw new NotFoundException("Patient record not found.");
        }
        $patient_id = $patient['patient_id'];

        // Check if already booked on this date
        if ($this->appointmentRepo->hasExistingAppointment($patient_id, $appointmentDate)) {
            throw new AppointmentException("You already have an appointment on this date.");
        }

        // Get default doctor
        $doctor = $this->doctorRepo->getFirstDoctor();
        if (!$doctor) {
            throw new AppointmentException("No doctors available in the system.");
        }
        $doctor_id = $doctor['doctor_id'];

        return $this->processBooking($patient_id, $doctor_id, $windowId, $appointmentDate, $userId, $userId, $userEmail, true);
    }

    public function staffBookAppointment($staffUserId, $email, $windowId, $appointmentDate) {
        // Find patient by email
        $patient = $this->patientRepo->findByEmail($email);
        if (!$patient) {
            throw new NotFoundException("Patient with this email not found.");
        }

        $patient_id = $patient['patient_id'];
        $patient_user_id = $patient['user_id'];
        $user_email = $patient['email'];

        // Check if already booked on this date
        if ($this->appointmentRepo->hasExistingAppointment($patient_id, $appointmentDate)) {
            throw new AppointmentException("Patient already has an appointment on this date.");
        }

        // Get default doctor
        $doctor = $this->doctorRepo->getFirstDoctor();
        $doctor_id = $doctor['doctor_id'];

        return $this->processBooking($patient_id, $doctor_id, $windowId, $appointmentDate, $staffUserId, $patient_user_id, $user_email, false);
    }

    private function processBooking($patientId, $doctorId, $windowId, $appointmentDate, $createdBy, $notifyUserId, $notifyEmail, $isSelfBooking) {
        // Get window details
        $window = $this->appointmentRepo->getWindowById($windowId);
        if (!$window) {
            throw new NotFoundException("Window not found.");
        }

        // Check if window has already passed for today
        $current_time = date('H:i:s');
        $today = date('Y-m-d');
        if ($appointmentDate == $today && $window['start_time'] <= $current_time) {
            throw new AppointmentException("This appointment window has already passed for today.");
        }

        // Get next queue number
        $current_count = $this->appointmentRepo->getBookedCount($windowId, $appointmentDate);
        $queue_number = $current_count + 1;

        if ($queue_number > $window['max_slots']) {
            throw new AppointmentException("This appointment window is full for selected date.");
        }

        // Calculate estimated time
        $estimated_time = $this->calculateEstimatedTime($window, $queue_number);

        // Create appointment
        $this->appointmentRepo->create($patientId, $doctorId, $windowId, $appointmentDate, 'Booked', $createdBy, $queue_number, $estimated_time);

        $formatted_time = date('h:i A', strtotime($estimated_time));
        $startTime = strtotime($window['start_time']);
        $endTime = strtotime($window['end_time']);
        $window_time = date('h:i A', $startTime) . " - " . date('h:i A', $endTime);

        // Notify
        if ($isSelfBooking) {
            $msg = "Your appointment is booked for " . $appointmentDate . ". Window: " . $window_time . ". Queue number: " . $queue_number . ". Estimated time: " . $formatted_time;
        } else {
            $msg = "A receptionist booked an appointment for you on " . $appointmentDate . ". Window: " . $window_time . ". Queue: " . $queue_number . " at " . $formatted_time;
        }
        $this->notificationService->create($notifyUserId, $msg, 'Appointment');

        // Email
        if ($isSelfBooking) {
            $subject = "UWU MedSync - Appointment Confirmation";
            $body = "<h2>Appointment Confirmed!</h2>
                     <p>Date: <strong>{$appointmentDate}</strong></p>
                     <p>Time Window: <strong>{$window_time}</strong></p>
                     <p>Queue Number: <strong>{$queue_number}</strong></p>
                     <p>Estimated Time: <strong>{$formatted_time}</strong></p>
                     <p></p>";
        } else {
            $subject = "UWU MedSync - Appointment Booked by Clinic";
            $body = "<h2>Appointment Confirmed!</h2>
                     <p>A clinic staff member has scheduled an appointment for you.</p>
                     <p>Date: <strong>{$appointmentDate}</strong></p>
                     <p>Time Window: <strong>{$window_time}</strong></p>
                     <p>Queue Number: <strong>{$queue_number}</strong></p>
                     <p>Estimated Time: <strong>{$formatted_time}</strong></p>";
        }
        EmailHelper::sendEmail($notifyEmail, $subject, $body);

        return [
            'queue_number' => $queue_number,
            'formatted_time' => $formatted_time,
            'email' => $notifyEmail
        ];
    }

    private function calculateEstimatedTime($window, $queueNumber) {
        $startTime = strtotime($window['start_time']);
        $endTime = strtotime($window['end_time']);
        $maxAllowed = (int)$window['max_slots'];
        $totalMinutes = ($endTime - $startTime) / 60;
        $timePerPatient = $maxAllowed > 0 ? $totalMinutes / $maxAllowed : 0;
        $bufferMinutes = $timePerPatient / 2;
        $offsetMinutes = round(($queueNumber - 1) * $timePerPatient - $bufferMinutes);
        return date('H:i:s', $startTime + ($offsetMinutes * 60));
    }

    public function getPatientAppointments($userId) {
        return $this->appointmentRepo->getPatientAppointments($userId);
    }

    public function cancelAppointment($userId, $appointmentId) {
        $appointment = $this->appointmentRepo->findByIdAndUser($appointmentId, $userId);

        if (!$appointment) {
            throw new NotFoundException("Appointment not found.");
        }

        if (!in_array($appointment['appointment_status'], ['Booked', 'Walk-In'])) {
            throw new AppointmentException("Only booked or walk-in appointments can be cancelled.");
        }

        $this->conn->beginTransaction();
        try {
            $this->appointmentRepo->updateStatus($appointmentId, 'Cancelled');

            $message = "Your appointment on {$appointment['appointment_date']} (Queue #{$appointment['queue_number']}) has been cancelled successfully.";
            $this->notificationService->create($userId, $message, 'Appointment');

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function cancelAppointmentsForDoctorLeave($doctorId, $leaveDate) {
        $appointments = $this->appointmentRepo->getAppointmentsForDoctorOnDate($doctorId, $leaveDate);

        foreach ($appointments as $apt) {
            // Update status
            $this->appointmentRepo->updateStatus($apt['appointment_id'], 'Cancelled');

            // Send email
            $subject = "UWU MedSync - Appointment Cancellation Notice";
            $body = "<h2>Appointment Cancelled</h2><p>Dear {$apt['full_name']},</p>
                     <p>We regret to inform you that your appointment on <strong>{$leaveDate}</strong> has been cancelled due to doctor leave.</p>
                     <p>We suggest you rebook your appointment for another available date.</p>
                     <p>Sorry for the inconvenience.</p>";
            EmailHelper::sendEmail($apt['email'], $subject, $body);

            // Create Notification
            $this->notificationService->createByEmail($apt['email'], "Your appointment on {$leaveDate} was cancelled due to doctor leave. Please rebook.", 'Appointment');
        }

        return count($appointments);
    }
}
?>
