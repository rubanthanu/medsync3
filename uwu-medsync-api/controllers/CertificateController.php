<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../validators/CertificateValidator.php';
require_once __DIR__ . '/../services/CertificateService.php';

class CertificateController extends BaseController {

    private $certificateService;

    public function __construct() {
        parent::__construct();
        $this->certificateService = new CertificateService($this->conn);
    }

    public function request() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 4) {
                throw new PermissionException("Only patients can request medical certificates.");
            }

            $start_date = $_POST['start_date'] ?? '';
            $end_date = $_POST['end_date'] ?? '';
            $reason = $_POST['reason'] ?? '';

            CertificateValidator::validateRequest($start_date, $end_date, $reason, !empty($_FILES['proof_pdf']));

            $this->certificateService->requestCertificate($auth->id, $start_date, $end_date, $reason, $_FILES['proof_pdf']);

            http_response_code(201);
            echo json_encode(["message" => "Medical certificate requested successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function review() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Only doctors can review requests.");
            }

            $data = json_decode(file_get_contents("php://input"));
            CertificateValidator::validateReview($data);

            $rejectionReason = isset($data->rejection_reason) ? $data->rejection_reason : null;
            $message = $this->certificateService->reviewCertificate($auth->id, $data->certificate_id, $data->status, $rejectionReason);

            http_response_code(200);
            echo json_encode(["message" => $message]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_requests() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2 && $auth->role_id != 1 && $auth->role_id != 3) {
                throw new PermissionException("Unauthorized access.");
            }

            $requests = $this->certificateService->getRequests();

            http_response_code(200);
            echo json_encode($requests);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_patient_certificates() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 4) {
                throw new PermissionException("Unauthorized access.");
            }

            $requests = $this->certificateService->getPatientCertificates($auth->id);

            http_response_code(200);
            echo json_encode($requests);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
