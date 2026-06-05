<?php
require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../repositories/PatientRepository.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';
require_once __DIR__ . '/../services/NotificationService.php';
require_once __DIR__ . '/../helpers/EmailHelper.php';
require_once __DIR__ . '/../exceptions/AuthException.php';
require_once __DIR__ . '/../exceptions/NotFoundException.php';
require_once __DIR__ . '/../exceptions/ValidationException.php';

class AuthService {
    private $conn;
    private $userRepo;
    private $patientRepo;
    private $doctorRepo;
    private $notificationService;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->userRepo = new UserRepository($conn);
        $this->patientRepo = new PatientRepository($conn);
        $this->doctorRepo = new DoctorRepository($conn);
        $this->notificationService = new NotificationService($conn);
    }

    public function register($data) {
        // Check if email exists
        $existing = $this->userRepo->emailExists($data->email);
        if ($existing) {
            if ($existing['is_verified'] == 0) {
                throw new AuthException("This email is registered but not verified.", 403);
            }
            throw new ValidationException("Email already registered.");
        }

        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

        $this->conn->beginTransaction();
        try {
            // Insert user
            $user_id = $this->userRepo->create(4, $data->email, $password_hash, $data->full_name, 0, 'Active');

            // Generate OTP
            $otp = sprintf("%06d", mt_rand(1, 999999));
            $this->userRepo->createOtp($user_id, $otp, 'Registration');

            // Send Email
            $subject = "UWU MedSync - Email Verification OTP";
            $body = "<h2>Welcome to UWU MedSync!</h2><p>Your OTP for registration is: <strong>$otp</strong></p><p>This OTP will expire in 15 minutes.</p>";
            EmailHelper::sendEmail($data->email, $subject, $body);

            // Log Email
            $this->userRepo->createEmailLog($user_id, $data->email, $subject, $body);

            $this->conn->commit();
            return $user_id;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function verifyOtp($email, $otp) {
        // Get user
        $user = $this->userRepo->emailExists($email);
        if (!$user) {
            throw new NotFoundException("User not found.");
        }

        $user_id = $user['user_id'];

        if ($user['is_verified'] == 1) {
            throw new ValidationException("Email already verified.");
        }

        // Check OTP
        $otpRecord = $this->userRepo->findValidOtp($user_id, $otp, 'Registration');
        if (!$otpRecord) {
            throw new ValidationException("Invalid or expired OTP.");
        }

        $this->conn->beginTransaction();
        try {
            // Update OTP to used
            $this->userRepo->markOtpUsed($otpRecord['otp_id']);

            // Update user to verified
            $this->userRepo->setVerified($user_id);

            // Create patient record
            $this->patientRepo->create($user_id);

            // Create Notification
            $this->notificationService->create($user_id, 'Welcome to UWU MedSync! Your account has been verified.', 'System');

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function resendOtp($email, $type) {
        // Get user
        $user = $this->userRepo->findByEmail($email);
        if (!$user) {
            throw new NotFoundException("User not found.");
        }

        // If it's for registration, check if already verified
        if ($type == 'Registration' && $user['is_verified'] == 1) {
            throw new ValidationException("Email already verified.");
        }

        // Generate new OTP
        $otp = sprintf("%06d", mt_rand(1, 999999));

        $this->conn->beginTransaction();
        try {
            // Save OTP
            $this->userRepo->createOtp($user['user_id'], $otp, $type);

            // Send Email
            $subject = "UWU MedSync - Your OTP Code";
            if ($type == 'Registration') {
                $subject = "UWU MedSync - Email Verification OTP";
                $body = "<h2>Verify your email</h2><p>Hi " . $user['full_name'] . ",</p><p>Your new OTP for registration is: <strong>$otp</strong></p><p>This OTP will expire in 15 minutes.</p>";
            } else {
                $body = "<h2>OTP Request</h2><p>Your OTP is: <strong>$otp</strong></p><p>This OTP will expire in 15 minutes.</p>";
            }

            EmailHelper::sendEmail($email, $subject, $body);

            // Log Email
            $this->userRepo->createEmailLog($user['user_id'], $email, $subject, $body);

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function login($email, $password) {
        $user = $this->userRepo->findByEmail($email);

        if (!$user) {
            throw new AuthException("Invalid credentials.");
        }

        if (!password_verify($password, $user['password'])) {
            throw new AuthException("Invalid credentials.");
        }

        if ($user['account_status'] != 'Active') {
            throw new AuthException("Account is not active.", 403);
        }

        if ($user['is_verified'] == 0) {
            throw new AuthException("Please verify your email first.", 403);
        }

        // Check if profile is completed
        $profile_completed = false;
        if ($user['role_name'] == 'Patient') {
            $profile_completed = $this->userRepo->checkProfileCompleted($user['user_id']);
        } else {
            $profile_completed = true;
        }

        // Regenerate session ID to prevent session fixation attacks
        session_regenerate_id(true);

        $userData = [
            "id" => $user['user_id'],
            "full_name" => $user['full_name'],
            "email" => $user['email'],
            "role" => $user['role_name'],
            "role_id" => $user['role_id'],
            "profile_image" => $user['profile_image'],
            "profile_completed" => $profile_completed
        ];

        $_SESSION['user'] = $userData;

        return $userData;
    }

    public function me() {
        if (isset($_SESSION['user']) && !empty($_SESSION['user'])) {
            $user_id = $_SESSION['user']['id'];
            $profile_image = $this->userRepo->getProfileImage($user_id);
            $_SESSION['user']['profile_image'] = $profile_image;
            return $_SESSION['user'];
        }
        return null;
    }

    public function logout() {
        if (session_id() == '') {
            session_start();
        }
        session_unset();
        session_destroy();
    }

    public function forgotPassword($email) {
        // Check if email exists
        $user = $this->userRepo->emailExists($email);
        if (!$user) {
            throw new NotFoundException("Email not found.");
        }

        $user_id = $user['user_id'];

        // Generate OTP
        $otp = sprintf("%06d", mt_rand(1, 999999));

        $this->conn->beginTransaction();
        try {
            // Save OTP
            $this->userRepo->createOtp($user_id, $otp, 'Forgot Password');

            // Send Email
            $subject = "UWU MedSync - Password Reset OTP";
            $body = "<h2>Password Reset Request</h2><p>Your OTP for password reset is: <strong>$otp</strong></p><p>This OTP will expire in 15 minutes.</p>";
            EmailHelper::sendEmail($email, $subject, $body);

            // Log Email
            $this->userRepo->createEmailLog($user_id, $email, $subject, $body);

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function verifyForgotPasswordOtp($email, $otp) {
        // Get user
        $user = $this->userRepo->emailExists($email);
        if (!$user) {
            throw new NotFoundException("User not found.");
        }

        $user_id = $user['user_id'];

        // Check OTP
        $otpRecord = $this->userRepo->findValidOtp($user_id, $otp, 'Forgot Password');
        if (!$otpRecord) {
            throw new ValidationException("Invalid or expired OTP.");
        }
    }

    public function resetPassword($email, $otp, $newPassword) {
        // Get user
        $user = $this->userRepo->emailExists($email);
        if (!$user) {
            throw new NotFoundException("User not found.");
        }

        $user_id = $user['user_id'];

        // Check OTP again for security
        $otpRecord = $this->userRepo->findValidOtp($user_id, $otp, 'Forgot Password');
        if (!$otpRecord) {
            throw new ValidationException("Invalid or expired OTP session.");
        }

        $password_hash = password_hash($newPassword, PASSWORD_BCRYPT);

        $this->conn->beginTransaction();
        try {
            // Update password
            $this->userRepo->updatePassword($user_id, $password_hash);

            // Mark OTP as used
            $this->userRepo->markOtpUsed($otpRecord['otp_id']);

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function changePassword($userId, $currentPassword, $newPassword) {
        // Get current password hash
        $passwordHash = $this->userRepo->getPasswordHash($userId);

        if (!password_verify($currentPassword, $passwordHash)) {
            throw new ValidationException("Incorrect current password.");
        }

        $new_password_hash = password_hash($newPassword, PASSWORD_BCRYPT);
        $this->userRepo->updatePassword($userId, $new_password_hash);
    }

    public function createUser($data) {
        // Check if email exists
        $existing = $this->userRepo->emailExists($data->email);
        if ($existing) {
            throw new ValidationException("Email already registered.");
        }

        $password_hash = password_hash($data->password, PASSWORD_BCRYPT);

        $this->conn->beginTransaction();
        try {
            $user_id = $this->userRepo->create($data->role_id, $data->email, $password_hash, $data->full_name, 1, 'Active');

            // Additional logic for role specific tables
            if ($data->role_id == 4) { // Patient
                $this->patientRepo->create($user_id);
            } else if ($data->role_id == 2) { // Doctor
                $this->doctorRepo->create($user_id);
            }

            $this->conn->commit();
            return $user_id;
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }
}
?>
