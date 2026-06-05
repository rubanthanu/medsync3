<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../services/NotificationService.php';

class NotificationController extends BaseController {

    private $notificationService;

    public function __construct() {
        parent::__construct();
        $this->notificationService = new NotificationService($this->conn);
    }

    public function get_all() {
        try {
            $auth = AuthMiddleware::authenticate();

            $notifications = $this->notificationService->getAll($auth->id);

            http_response_code(200);
            echo json_encode($notifications);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function mark_read() {
        try {
            $auth = AuthMiddleware::authenticate();

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->notification_id)) {
                throw new ValidationException("Notification ID is required.");
            }

            $this->notificationService->markRead($data->notification_id, $auth->id);

            http_response_code(200);
            echo json_encode(["message" => "Notification marked as read."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
