<?php
require_once __DIR__ . '/../repositories/AppointmentRepository.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';
require_once __DIR__ . '/../exceptions/AppointmentException.php';
require_once __DIR__ . '/../exceptions/PermissionException.php';

class QueueService {
    private $conn;
    private $appointmentRepo;
    private $doctorRepo;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->appointmentRepo = new AppointmentRepository($conn);
        $this->doctorRepo = new DoctorRepository($conn);
    }

    public function getQueue($windowId, $date) {
        return $this->appointmentRepo->getQueueForWindow($windowId, $date);
    }

    public function updateStatus($appointmentId, $status) {
        $this->appointmentRepo->updateStatus($appointmentId, $status);
    }

    public function startWindow($userId, $windowId) {
        $date = date('Y-m-d');

        // Get Doctor ID
        $doctor = $this->doctorRepo->findByUserId($userId);

        // Check if window is already started
        if ($this->appointmentRepo->isWindowActive($windowId, $date)) {
            throw new AppointmentException("This window is already ongoing.");
        }

        // Start window
        $this->appointmentRepo->startWindow($doctor['doctor_id'], $windowId, $date);
    }

    public function nextPatient($userId, $windowId) {
        $date = date('Y-m-d');

        $this->conn->beginTransaction();
        try {
            // Find Current patient and mark Completed
            $current = $this->appointmentRepo->findCurrentInWindow($windowId, $date);
            if ($current) {
                $this->appointmentRepo->updateStatus($current['appointment_id'], 'Completed');
            }

            // Find next Walk-In
            $next = $this->appointmentRepo->findNextWalkIn($windowId, $date);

            if ($next) {
                $this->appointmentRepo->updateStatus($next['appointment_id'], 'Current');
                $this->conn->commit();
                return ['message' => 'Next patient called.', 'queue_number' => $next['queue_number']];
            } else {
                $this->conn->commit();
                return ['message' => 'No more walk-in patients in the queue.'];
            }
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function stopWindow($windowId) {
        $date = date('Y-m-d');
        $this->appointmentRepo->stopWindow($windowId, $date);
    }
}
?>
