<?php
class PrescriptionRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function create($appointmentId, $patientId, $doctorId, $medicines, $dosage, $instructions, $pdfFile) {
        $query = "INSERT INTO prescriptions (appointment_id, patient_id, doctor_id, medicines, dosage, instructions, prescription_pdf) 
                  VALUES (:appointment_id, :patient_id, :doctor_id, :medicines, :dosage, :instructions, :pdf)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":appointment_id", $appointmentId);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":medicines", $medicines);
        $stmt->bindParam(":dosage", $dosage);
        $stmt->bindParam(":instructions", $instructions);
        $stmt->bindParam(":pdf", $pdfFile);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    public function getPatientFromAppointment($appointmentId) {
        $query = "SELECT a.patient_id, p.user_id as patient_user_id, u.full_name as patient_name, u.email as patient_email 
                  FROM appointments a 
                  JOIN patients p ON a.patient_id = p.patient_id 
                  JOIN users u ON p.user_id = u.user_id 
                  WHERE a.appointment_id = :appointment_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":appointment_id", $appointmentId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function createCheckupHistory($appointmentId, $patientId, $doctorId, $diagnosis, $notes) {
        $query = "INSERT INTO checkup_history (appointment_id, patient_id, doctor_id, diagnosis, notes) 
                  VALUES (:appointment_id, :patient_id, :doctor_id, :diagnosis, :notes)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":appointment_id", $appointmentId);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":diagnosis", $diagnosis);
        $stmt->bindParam(":notes", $notes);
        $stmt->execute();
    }

    public function getHistory($patientId) {
        $query = "SELECT ch.*, u.full_name as doctor_name, pr.medicines, pr.dosage, pr.instructions, pr.prescription_pdf, ch.created_at
                  FROM checkup_history ch
                  JOIN doctors d ON ch.doctor_id = d.doctor_id
                  JOIN users u ON d.user_id = u.user_id
                  LEFT JOIN prescriptions pr ON ch.appointment_id = pr.appointment_id
                  WHERE ch.patient_id = :patient_id
                  ORDER BY ch.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getPatientPrescriptions($userId) {
        $query = "SELECT pr.*, u.full_name as doctor_name 
                  FROM prescriptions pr 
                  JOIN patients p ON pr.patient_id = p.patient_id 
                  JOIN doctors d ON pr.doctor_id = d.doctor_id 
                  JOIN users u ON d.user_id = u.user_id 
                  WHERE p.user_id = :user_id 
                  ORDER BY pr.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalCount() {
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM prescriptions");
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
}
?>
