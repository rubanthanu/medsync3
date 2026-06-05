<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../validators/AuthValidator.php';
require_once __DIR__ . '/../services/AuthService.php';

class AuthController extends BaseController {

    private $authService;

    public function __construct() {
        parent::__construct();
        $this->authService = new AuthService($this->conn);
    }

    public function register() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateRegister($data);

            $user_id = $this->authService->register($data);

            http_response_code(201);
            echo json_encode(["message" => "Registration successful. Please verify your email.", "user_id" => $user_id]);
        } catch (AuthException $e) {
            // Special case: unverified email returns requires_verification flag
            $response = ["message" => $e->getMessage()];
            if (strpos($e->getMessage(), 'not verified') !== false) {
                $response["requires_verification"] = true;
            }
            $this->jsonResponse($e->getCode() ?: 403, $response);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function verify_otp() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateOtp($data);

            $this->authService->verifyOtp($data->email, $data->otp);

            http_response_code(200);
            echo json_encode(["message" => "Email verified successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function resend_otp() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateResendOtp($data);

            $this->authService->resendOtp($data->email, $data->type);

            http_response_code(200);
            echo json_encode(["message" => "New OTP sent to your email."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function login() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateLogin($data);

            $userData = $this->authService->login($data->email, $data->password);

            http_response_code(200);
            echo json_encode([
                "message" => "Login successful.",
                "user" => $userData
            ]);
        } catch (AuthException $e) {
            $code = $e->getCode() ?: 401;
            $response = ["message" => $e->getMessage()];
            if (strpos($e->getMessage(), 'verify your email') !== false) {
                $response["requires_verification"] = true;
            }
            $this->jsonResponse($code, $response);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function me() {
        try {
            $userData = $this->authService->me();

            if ($userData) {
                http_response_code(200);
                echo json_encode(["user" => $userData]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Not authenticated"]);
            }
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function logout() {
        try {
            $this->authService->logout();

            http_response_code(200);
            echo json_encode(["message" => "Logout successful"]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function forgot_password() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateForgotPassword($data);

            $this->authService->forgotPassword($data->email);

            http_response_code(200);
            echo json_encode(["message" => "OTP sent to your email."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function verify_forgot_password_otp() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateOtp($data);

            $this->authService->verifyForgotPasswordOtp($data->email, $data->otp);

            http_response_code(200);
            echo json_encode(["message" => "OTP verified successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function reset_password() {
        try {
            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateResetPassword($data);

            $this->authService->resetPassword($data->email, $data->otp, $data->new_password);

            http_response_code(200);
            echo json_encode(["message" => "Password reset successful."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function change_password() {
        try {
            if (!isset($_SESSION['user'])) {
                http_response_code(401);
                echo json_encode(["message" => "Unauthorized"]);
                return;
            }

            $data = json_decode(file_get_contents("php://input"));
            AuthValidator::validateChangePassword($data);

            $this->authService->changePassword($_SESSION['user']['id'], $data->current_password, $data->new_password);

            http_response_code(200);
            echo json_encode(["message" => "Password changed successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
