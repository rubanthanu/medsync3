<?php
class PatientRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function findByUserId($userId) {
        $query = "SELECT patient_id FROM patients WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findById($patientId) {
        $query = "SELECT p.*, u.full_name, u.email, u.phone, u.gender, u.date_of_birth, u.address, u.profile_image 
                  FROM patients p 
                  JOIN users u ON p.user_id = u.user_id 
                  WHERE p.patient_id = :patient_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":patient_id", $patientId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function create($userId) {
        $query = "INSERT INTO patients (user_id) VALUES (:user_id)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function findByEmail($email) {
        $query = "SELECT u.user_id, u.email, p.patient_id 
                  FROM users u 
                  JOIN patients p ON u.user_id = p.user_id 
                  WHERE u.email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function updateProfile($userId, $universityId, $bloodGroup, $allergies, $medicalConditions, $emergencyContactName, $emergencyContactPhone) {
        $query = "UPDATE patients SET 
                    university_id = :uid, 
                    blood_group = :bg, 
                    allergies = :allergies, 
                    medical_conditions = :mc, 
                    emergency_contact_name = :ecn, 
                    emergency_contact_phone = :ecp 
                  WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":uid", $universityId);
        $stmt->bindParam(":bg", $bloodGroup);
        $stmt->bindParam(":allergies", $allergies);
        $stmt->bindParam(":mc", $medicalConditions);
        $stmt->bindParam(":ecn", $emergencyContactName);
        $stmt->bindParam(":ecp", $emergencyContactPhone);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function getPatientDetails($userId) {
        $query = "SELECT university_id, blood_group, allergies, medical_conditions, emergency_contact_name, emergency_contact_phone 
                  FROM patients WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?>
