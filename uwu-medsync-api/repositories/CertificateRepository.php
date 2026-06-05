<?php
class CertificateRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function create($patientId, $startDate, $endDate, $reason, $proofPdf) {
        $query = "INSERT INTO medical_certificates (patient_id, start_date, end_date, reason, proof_pdf, status) 
                  VALUES (:patient_id, :start_date, :end_date, :reason, :proof_pdf, 'Pending')";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->bindParam(":start_date", $startDate);
        $stmt->bindParam(":end_date", $endDate);
        $stmt->bindParam(":reason", $reason);
        $stmt->bindParam(":proof_pdf", $proofPdf);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    public function findById($certificateId) {
        $query = "SELECT mc.*, p.user_id as patient_user_id, u.full_name as patient_name, u.email as patient_email, 
                         u.gender, u.date_of_birth, p.university_id 
                  FROM medical_certificates mc 
                  JOIN patients p ON mc.patient_id = p.patient_id 
                  JOIN users u ON p.user_id = u.user_id 
                  WHERE mc.certificate_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $certificateId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateApproved($certificateId, $doctorId, $pdfFile) {
        $query = "UPDATE medical_certificates SET status = 'Approved', doctor_id = :doctor_id, certificate_pdf = :pdf, reviewed_at = NOW() WHERE certificate_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":pdf", $pdfFile);
        $stmt->bindParam(":id", $certificateId);
        $stmt->execute();
    }

    public function updateRejected($certificateId, $doctorId, $reason) {
        $query = "UPDATE medical_certificates SET status = 'Rejected', rejection_reason = :reason, doctor_id = :doctor_id, reviewed_at = NOW() WHERE certificate_id = :id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":reason", $reason);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":id", $certificateId);
        $stmt->execute();
    }

    public function getAll() {
        $query = "SELECT mc.*, u.full_name as patient_name, p.university_id 
                  FROM medical_certificates mc 
                  JOIN patients p ON mc.patient_id = p.patient_id 
                  JOIN users u ON p.user_id = u.user_id 
                  ORDER BY mc.requested_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getByPatientUserId($userId) {
        $query = "SELECT mc.*, u.full_name as doctor_name 
                  FROM medical_certificates mc 
                  JOIN patients p ON mc.patient_id = p.patient_id 
                  LEFT JOIN doctors d ON mc.doctor_id = d.doctor_id 
                  LEFT JOIN users u ON d.user_id = u.user_id 
                  WHERE p.user_id = :user_id 
                  ORDER BY mc.requested_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalCount() {
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM medical_certificates");
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }
}
?>
