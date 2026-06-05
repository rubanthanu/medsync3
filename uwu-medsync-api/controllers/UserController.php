<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../validators/UserValidator.php';
require_once __DIR__ . '/../services/UserService.php';

class UserController extends BaseController {

    private $userService;

    public function __construct() {
        parent::__construct();
        $this->userService = new UserService($this->conn);
    }

    public function complete_profile() {
        try {
            $auth = AuthMiddleware::authenticate();
            $data = json_decode(file_get_contents("php://input"));

            UserValidator::validateCompleteProfile($data);

            $this->userService->completeProfile($auth->id, $data);

            http_response_code(200);
            echo json_encode(["message" => "Profile completed successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_profile() {
        try {
            $auth = AuthMiddleware::authenticate();

            $user = $this->userService->getProfile($auth->id);

            http_response_code(200);
            echo json_encode($user);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function update_profile() {
        try {
            $auth = AuthMiddleware::authenticate();

            // Handle both application/json or multipart/form-data for profile image upload
            $data = null;
            if (str_contains($_SERVER['CONTENT_TYPE'] ?? '', 'multipart/form-data')) {
                $data = (object)$_POST;
            } else {
                $data = json_decode(file_get_contents("php://input"));
            }

            if (!$data) {
                throw new ValidationException("No data provided.");
            }

            UserValidator::validateUpdateProfile($data);

            $result = $this->userService->updateProfile($auth->id, $auth->role_id, $data, $_FILES);

            http_response_code(200);
            echo json_encode([
                "message" => "Profile updated successfully.",
                "profile_image" => $result['profile_image'],
                "full_name" => $result['full_name']
            ]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_patient_details() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2 && $auth->role_id != 1) {
                throw new PermissionException("Unauthorized access.");
            }

            $patient_id = isset($_GET['patient_id']) ? $_GET['patient_id'] : null;
            if (empty($patient_id)) {
                throw new ValidationException("Patient ID is required.");
            }

            $patient = $this->userService->getPatientDetails($patient_id);

            http_response_code(200);
            echo json_encode($patient);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
