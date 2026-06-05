<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../repositories/FeedbackRepository.php';
require_once __DIR__ . '/../repositories/PatientRepository.php';

class FeedbackController extends BaseController {

    private $feedbackRepo;
    private $patientRepo;

    public function __construct() {
        parent::__construct();
        $this->feedbackRepo = new FeedbackRepository($this->conn);
        $this->patientRepo = new PatientRepository($this->conn);
    }

    public function submit() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 4) {
                throw new PermissionException("Only patients can submit feedback.");
            }

            $data = json_decode(file_get_contents("php://input"));
            $feedback_text = isset($data->feedback_text) ? trim($data->feedback_text) : '';

            if ($feedback_text === '') {
                throw new ValidationException("Feedback text is required.");
            }

            $patient = $this->patientRepo->findByUserId($auth->id);
            if (!$patient) {
                throw new NotFoundException("Patient record not found.");
            }

            $this->feedbackRepo->create($patient['patient_id'], $feedback_text);

            http_response_code(201);
            echo json_encode(["message" => "Feedback submitted successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_all() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 1 && $auth->role_id != 2) {
                throw new PermissionException("Access denied.");
            }

            $feedbacks = $this->feedbackRepo->getAll();

            http_response_code(200);
            echo json_encode($feedbacks);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>