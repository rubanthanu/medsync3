<?php
class UserRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function findByEmail($email) {
        $query = "SELECT u.*, r.role_name 
                  FROM users u 
                  JOIN roles r ON u.role_id = r.role_id 
                  WHERE u.email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function findById($userId) {
        $query = "SELECT user_id, role_id, email, full_name, phone, gender, date_of_birth, address, profile_image, account_status, created_at 
                  FROM users WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function emailExists($email) {
        $query = "SELECT user_id, is_verified FROM users WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
        if ($stmt->rowCount() > 0) {
            return $stmt->fetch(PDO::FETCH_ASSOC);
        }
        return false;
    }

    public function create($roleId, $email, $passwordHash, $fullName, $isVerified = 0, $accountStatus = 'Active') {
        $query = "INSERT INTO users (role_id, email, password, full_name, is_verified, account_status) 
                  VALUES (:role_id, :email, :password, :full_name, :is_verified, :account_status)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":role_id", $roleId);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":password", $passwordHash);
        $stmt->bindParam(":full_name", $fullName);
        $stmt->bindParam(":is_verified", $isVerified);
        $stmt->bindParam(":account_status", $accountStatus);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    public function updatePassword($userId, $passwordHash) {
        $query = "UPDATE users SET password = :password WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":password", $passwordHash);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function setVerified($userId) {
        $query = "UPDATE users SET is_verified = 1 WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function getPasswordHash($userId) {
        $query = "SELECT password FROM users WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        return $user ? $user['password'] : null;
    }

    public function getProfileImage($userId) {
        $query = "SELECT profile_image FROM users WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        $res = $stmt->fetch(PDO::FETCH_ASSOC);
        return $res ? $res['profile_image'] : null;
    }

    public function updateBasicProfile($userId, $fullName, $phone, $gender, $dob, $address, $profileImage = null) {
        $query = "UPDATE users SET 
                    full_name = :full_name, 
                    phone = :phone, 
                    gender = :gender, 
                    date_of_birth = :dob, 
                    address = :address" . 
                    ($profileImage ? ", profile_image = :profile_image" : "") . " 
                  WHERE user_id = :user_id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":full_name", $fullName);
        $stmt->bindParam(":phone", $phone);
        $stmt->bindParam(":gender", $gender);
        $stmt->bindParam(":dob", $dob);
        $stmt->bindParam(":address", $address);
        if ($profileImage) {
            $stmt->bindParam(":profile_image", $profileImage);
        }
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function updateStatus($userId, $status) {
        $query = "UPDATE users SET account_status = :status WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":status", $status);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function getAllUsersWithRoles() {
        $query = "SELECT u.user_id, u.full_name, u.email, u.account_status, r.role_name 
                  FROM users u JOIN roles r ON u.role_id = r.role_id";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function getTotalPatients() {
        $stmt = $this->conn->query("SELECT COUNT(*) as count FROM users WHERE role_id = 4");
        return $stmt->fetch(PDO::FETCH_ASSOC)['count'];
    }

    // OTP Methods
    public function createOtp($userId, $otpCode, $otpType) {
        $query = "INSERT INTO otp_verifications (user_id, otp_code, otp_type, expires_at) 
                  VALUES (:user_id, :otp_code, :otp_type, DATE_ADD(NOW(), INTERVAL 15 MINUTE))";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":otp_code", $otpCode);
        $stmt->bindParam(":otp_type", $otpType);
        $stmt->execute();
    }

    public function findValidOtp($userId, $otpCode, $otpType) {
        $query = "SELECT otp_id FROM otp_verifications 
                  WHERE user_id = :user_id AND otp_code = :otp_code AND otp_type = :otp_type 
                  AND is_used = 0 AND expires_at > NOW() 
                  ORDER BY created_at DESC LIMIT 1";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":otp_code", $otpCode);
        $stmt->bindParam(":otp_type", $otpType);
        $stmt->execute();
        if ($stmt->rowCount() == 0) {
            return false;
        }
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function markOtpUsed($otpId) {
        $query = "UPDATE otp_verifications SET is_used = 1 WHERE otp_id = :otp_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":otp_id", $otpId);
        $stmt->execute();
    }

    public function createEmailLog($userId, $email, $subject, $body) {
        $query = "INSERT INTO email_logs (user_id, recipient_email, subject, message, email_status, sent_at) 
                  VALUES (:user_id, :email, :subject, :body, 'Sent', NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":email", $email);
        $stmt->bindParam(":subject", $subject);
        $stmt->bindParam(":body", $body);
        $stmt->execute();
    }

    public function createProfileLog($userId, $action) {
        $query = "INSERT INTO profile_logs (user_id, action, log_time) VALUES (:user_id, :action, NOW())";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":action", $action);
        $stmt->execute();
    }

    public function checkProfileCompleted($userId) {
        $query = "SELECT university_id FROM patients WHERE user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        $patient = $stmt->fetch(PDO::FETCH_ASSOC);
        return !empty($patient['university_id']);
    }
}
?>
