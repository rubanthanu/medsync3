<?php
require_once __DIR__ . '/../repositories/PrescriptionRepository.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';
require_once __DIR__ . '/../repositories/AppointmentRepository.php';
require_once __DIR__ . '/../repositories/PatientRepository.php';
require_once __DIR__ . '/../services/NotificationService.php';
require_once __DIR__ . '/../helpers/PDFHelper.php';
require_once __DIR__ . '/../exceptions/NotFoundException.php';

class PrescriptionService {
    private $conn;
    private $prescriptionRepo;
    private $doctorRepo;
    private $appointmentRepo;
    private $patientRepo;
    private $notificationService;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->prescriptionRepo = new PrescriptionRepository($conn);
        $this->doctorRepo = new DoctorRepository($conn);
        $this->appointmentRepo = new AppointmentRepository($conn);
        $this->patientRepo = new PatientRepository($conn);
        $this->notificationService = new NotificationService($conn);
    }

    public function createPrescription($userId, $data) {
        // Get Doctor ID
        $doctor = $this->doctorRepo->findByUserId($userId);

        // Get Patient from appointment
        $patient = $this->prescriptionRepo->getPatientFromAppointment($data->appointment_id);
        if (!$patient) {
            throw new NotFoundException("Appointment not found.");
        }

        $this->conn->beginTransaction();
        try {
            // Fetch reviewer doctor's signature details
            $doc_details = $this->doctorRepo->getDetailsWithSignature($doctor['doctor_id']);

            $sig_html = "";
            if (extension_loaded('gd') && $doc_details && !empty($doc_details['digital_signature'])) {
                $sig_path = __DIR__ . '/../' . $doc_details['digital_signature'];
                if (file_exists($sig_path)) {
                    $sig_data = base64_encode(file_get_contents($sig_path));
                    $sig_html = "<img src='data:image/png;base64,{$sig_data}' style='max-height:80px; max-width:200px; display:block; margin: 10px 0 0 auto;' />";
                }
            }
            if (empty($sig_html)) {
                $sig_html = "<div style='margin-top: 20px; text-align: right;'><div style='display:inline-block; padding: 10px 18px; border: 1px solid #0056b3; border-radius: 999px; background: #f4f8ff; color: #0056b3; font-weight: 700; letter-spacing: 0.04em;'>Dr. " . ($doc_details['doctor_name'] ?? 'Doctor') . "</div></div>";
            }

            // Generate PDF with the exact same HTML template
            $html = "
                <div style='font-family: sans-serif; padding: 20px; border: 1px solid #ccc;'>
                    <div style='text-align:center;'>
                        <h2 style='color:#0056b3; margin-bottom:5px;'>UWU MedSync</h2>
                        <h4 style='color:#666; margin-top:0;'>University Medical Center - e-Prescription</h4>
                        <hr style='border: 1px solid #0056b3;'>
                    </div>
                    <br>
                    <div style='margin-bottom: 20px;'>
                        <p><strong>Patient Name:</strong> {$patient['patient_name']}</p>
                        <p><strong>Date:</strong> " . date('Y-m-d') . "</p>
                        <p><strong>Diagnosis:</strong> " . ($data->diagnosis ?? 'General Checkup') . "</p>
                    </div>
                    <hr>
                    <br>
                    <div>
                        <h4 style='color:#0056b3; margin-bottom: 5px;'>Prescribed Medicines:</h4>
                        <p style='background-color:#f9f9f9; padding: 15px; border-radius:5px; white-space: pre-wrap;'>{$data->medicines}</p>
                        
                        <h4 style='color:#0056b3; margin-bottom: 5px;'>Dosage:</h4>
                        <p style='background-color:#f9f9f9; padding: 10px; border-radius:5px;'>{$data->dosage}</p>
                        
                        <h4 style='color:#0056b3; margin-bottom: 5px;'>Instructions:</h4>
                        <p style='background-color:#f9f9f9; padding: 10px; border-radius:5px;'>{$data->instructions}</p>
                    </div>
                    <br><br><br>
                    <div style='float: right; text-align: right;'>
                        {$sig_html}
                        <p style='border-top: 1px solid #ccc; width: 250px; margin: 5px 0 0 auto; font-size: 14px; font-weight: bold; color:#555;'>Dr. " . ($doc_details['doctor_name'] ?? 'Doctor') . "</p>
                    </div>
                    <div style='clear: both;'></div>
                </div>
            ";

            $target_dir = __DIR__ . "/../uploads/generated_pdfs/";
            $file_name = "presc_" . uniqid() . ".pdf";
            PDFHelper::generatePDF($html, $file_name, $target_dir);

            // Save to prescriptions table
            $this->prescriptionRepo->create(
                $data->appointment_id,
                $patient['patient_id'],
                $doctor['doctor_id'],
                $data->medicines,
                $data->dosage,
                $data->instructions,
                $file_name
            );

            // Save to checkup_history table
            $this->prescriptionRepo->createCheckupHistory(
                $data->appointment_id,
                $patient['patient_id'],
                $doctor['doctor_id'],
                $data->diagnosis,
                $data->notes
            );

            // Update appointment status to Completed
            $this->appointmentRepo->updateStatus($data->appointment_id, 'Completed');

            // Notify
            $msg = "A new prescription has been generated for you.";
            $this->notificationService->create($patient['patient_user_id'], $msg, 'Prescription');

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function getHistory($userId, $roleId, $patientId = null) {
        if (empty($patientId)) {
            // If patient is checking their own history
            if ($roleId == 4) {
                $patient = $this->patientRepo->findByUserId($userId);
                $patientId = $patient['patient_id'] ?? null;
            }
        }

        if (empty($patientId)) {
            throw new \Exception("Patient ID is required.");
        }

        return $this->prescriptionRepo->getHistory($patientId);
    }

    public function getPatientPrescriptions($userId) {
        return $this->prescriptionRepo->getPatientPrescriptions($userId);
    }
}
?>
