<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../services/QueueService.php';

class QueueController extends BaseController {

    private $queueService;

    public function __construct() {
        parent::__construct();
        $this->queueService = new QueueService($this->conn);
    }

    public function get_queue() {
        try {
            $auth = AuthMiddleware::authenticate();
            $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');
            $window_id = isset($_GET['window_id']) ? $_GET['window_id'] : 0;

            if (empty($window_id)) {
                throw new ValidationException("Window ID is required.");
            }

            $queue = $this->queueService->getQueue($window_id, $date);

            http_response_code(200);
            echo json_encode($queue);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function update_status() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 3 && $auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->appointment_id) || empty($data->status)) {
                throw new ValidationException("Appointment ID and status are required.");
            }

            $this->queueService->updateStatus($data->appointment_id, $data->status);

            http_response_code(200);
            echo json_encode(["message" => "Status updated successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function start_window() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Only doctors can start a window.");
            }

            $data = json_decode(file_get_contents("php://input"));

            $this->queueService->startWindow($auth->id, $data->window_id);

            http_response_code(200);
            echo json_encode(["message" => "Window started successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function next_patient() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));

            $result = $this->queueService->nextPatient($auth->id, $data->window_id);

            http_response_code(200);
            echo json_encode($result);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function stop_window() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Only doctors can stop a window.");
            }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->window_id)) {
                throw new ValidationException("Window ID is required.");
            }

            $this->queueService->stopWindow($data->window_id);

            http_response_code(200);
            echo json_encode(["message" => "Window stopped successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
