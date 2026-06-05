<?php
class DoctorRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function findByUserId($userId) {
        $query = "SELECT doctor_id FROM doctors WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getFirstDoctor() {
        $query = "SELECT doctor_id FROM doctors LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function getDetailsWithSignature($doctorId) {
        $query = "SELECT d.digital_signature, u.full_name as doctor_name 
                  FROM doctors d 
                  JOIN users u ON d.user_id = u.user_id 
                  WHERE d.doctor_id = :doctor_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($userId) {
        $query = "INSERT INTO doctors (user_id) VALUES (:user_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function countWorkingDoctors($date) {
        $query = "SELECT COUNT(*) as working_doctors FROM doctors d 
                  WHERE d.doctor_id NOT IN (SELECT doctor_id FROM doctor_leaves WHERE leave_date = :date)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":date", $date);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC)['working_doctors'];
    }

    public function markLeave($doctorId, $leaveDate, $reason) {
        $query = "INSERT INTO doctor_leaves (doctor_id, leave_date, reason) VALUES (:doctor_id, :leave_date, :reason)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":leave_date", $leaveDate);
        $stmt->bindParam(":reason", $reason);
        $stmt->execute();
    }

    public function hasLeave($doctorId, $leaveDate) {
        $query = "SELECT leave_id FROM doctor_leaves WHERE doctor_id = :doctor_id AND leave_date = :leave_date";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":doctor_id", $doctorId);
        $stmt->bindParam(":leave_date", $leaveDate);
        $stmt->execute();
        return $stmt->rowCount() > 0;
    }

    public function getLeaves($userId) {
        $query = "SELECT dl.* FROM doctor_leaves dl 
                  JOIN doctors d ON dl.doctor_id = d.doctor_id 
                  WHERE d.user_id = :user_id ORDER BY dl.leave_date DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function deleteLeave($leaveId, $userId) {
        $query = "DELETE dl FROM doctor_leaves dl 
                  JOIN doctors d ON dl.doctor_id = d.doctor_id 
                  WHERE dl.leave_id = :leave_id AND d.user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":leave_id", $leaveId);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function updateSpecialization($userId, $specialization, $digitalSignature = null) {
        $query = "UPDATE doctors SET 
                    specialization = :specialization" . 
                    ($digitalSignature ? ", digital_signature = :digital_signature" : "") . " 
                  WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":specialization", $specialization);
        if ($digitalSignature) {
            $stmt->bindParam(":digital_signature", $digitalSignature);
        }
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function getDoctorDetails($userId) {
        $query = "SELECT specialization, digital_signature FROM doctors WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
