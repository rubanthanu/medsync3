<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../validators/PrescriptionValidator.php';
require_once __DIR__ . '/../services/PrescriptionService.php';

class PrescriptionController extends BaseController {

    private $prescriptionService;

    public function __construct() {
        parent::__construct();
        $this->prescriptionService = new PrescriptionService($this->conn);
    }

    public function create() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Only doctors can create prescriptions.");
            }

            $data = json_decode(file_get_contents("php://input"));
            PrescriptionValidator::validateCreate($data);

            $this->prescriptionService->createPrescription($auth->id, $data);

            http_response_code(201);
            echo json_encode(["message" => "Prescription created and PDF generated successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_history() {
        try {
            $auth = AuthMiddleware::authenticate();

            $patient_id = isset($_GET['patient_id']) ? $_GET['patient_id'] : null;

            $history = $this->prescriptionService->getHistory($auth->id, $auth->role_id, $patient_id);

            http_response_code(200);
            echo json_encode($history);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_patient_prescriptions() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 4) {
                throw new PermissionException("Unauthorized access.");
            }

            $prescriptions = $this->prescriptionService->getPatientPrescriptions($auth->id);

            http_response_code(200);
            echo json_encode($prescriptions);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
