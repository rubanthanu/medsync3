<?php
class FeedbackRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function create($patientId, $feedbackText) {
        $query = "INSERT INTO feedback (patient_id, feedback_text) VALUES (:patient_id, :feedback_text)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->bindParam(":feedback_text", $feedbackText);
        $stmt->execute();
    }

    public function getAll() {
        $query = "SELECT f.*, u.full_name as patient_name, u.email as patient_email 
                  FROM feedback f 
                  JOIN patients p ON f.patient_id = p.patient_id 
                  JOIN users u ON p.user_id = u.user_id 
                  ORDER BY f.submitted_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
}
?>
