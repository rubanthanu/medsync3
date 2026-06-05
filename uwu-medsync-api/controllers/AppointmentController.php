<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../validators/AppointmentValidator.php';
require_once __DIR__ . '/../services/AppointmentService.php';

class AppointmentController extends BaseController {

    private $appointmentService;

    public function __construct() {
        parent::__construct();
        $this->appointmentService = new AppointmentService($this->conn);
    }

    public function get_windows() {
        try {
            $auth = AuthMiddleware::authenticate();
            $date = isset($_GET['date']) ? $_GET['date'] : date('Y-m-d');

            $windows = $this->appointmentService->getWindows($date, $auth->role_id);

            http_response_code(200);
            echo json_encode($windows);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function book() {
        try {
            $auth = AuthMiddleware::authenticate();
            $data = json_decode(file_get_contents("php://input"));

            AppointmentValidator::validateBook($data);

            $result = $this->appointmentService->bookAppointment($auth->id, $auth->email, $data->window_id, $data->appointment_date);

            http_response_code(201);
            echo json_encode([
                "message" => "Appointment booked successfully.",
                "queue_number" => $result['queue_number'],
                "estimated_time" => $result['formatted_time']
            ]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function staff_book() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 1 && $auth->role_id != 3) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));
            AppointmentValidator::validateStaffBook($data);

            $result = $this->appointmentService->staffBookAppointment($auth->id, $data->email, $data->window_id, $data->appointment_date);

            http_response_code(201);
            echo json_encode([
                "message" => "Appointment booked successfully for " . $result['email'],
                "queue_number" => $result['queue_number'],
                "estimated_time" => $result['formatted_time']
            ]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_patient_appointments() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 4) {
                throw new PermissionException("Unauthorized access.");
            }

            $appointments = $this->appointmentService->getPatientAppointments($auth->id);

            http_response_code(200);
            echo json_encode($appointments);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function cancel() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 4) {
                throw new PermissionException("Only patients can cancel appointments.");
            }

            $data = json_decode(file_get_contents("php://input"));
            AppointmentValidator::validateCancel($data);

            $this->appointmentService->cancelAppointment($auth->id, $data->appointment_id);

            http_response_code(200);
            echo json_encode(["message" => "Appointment cancelled successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
