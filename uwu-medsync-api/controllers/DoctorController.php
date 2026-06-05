<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../services/AppointmentService.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';

class DoctorController extends BaseController {

    private $appointmentService;
    private $doctorRepo;

    public function __construct() {
        parent::__construct();
        $this->appointmentService = new AppointmentService($this->conn);
        $this->doctorRepo = new DoctorRepository($this->conn);
    }

    public function mark_leave() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->leave_date)) {
                throw new ValidationException("Leave date is required.");
            }

            // Get doctor_id
            $doctor = $this->doctorRepo->findByUserId($auth->id);
            if (!$doctor) {
                throw new NotFoundException("Doctor record not found.");
            }
            $doctor_id = $doctor['doctor_id'];

            // Check if already on leave
            if ($this->doctorRepo->hasLeave($doctor_id, $data->leave_date)) {
                throw new AppointmentException("You are already on leave for this date.");
            }

            $this->conn->beginTransaction();
            try {
                // Insert leave
                $reason = isset($data->reason) ? $data->reason : "Medical Leave";
                $this->doctorRepo->markLeave($doctor_id, $data->leave_date, $reason);

                // Cancel appointments and notify patients
                $cancelledCount = $this->appointmentService->cancelAppointmentsForDoctorLeave($doctor_id, $data->leave_date);

                $this->conn->commit();
                http_response_code(200);
                echo json_encode(["message" => "Leave marked successfully. " . $cancelledCount . " appointments cancelled and patients notified."]);
            } catch (Exception $e) {
                $this->conn->rollBack();
                throw $e;
            }
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function get_leaves() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $leaves = $this->doctorRepo->getLeaves($auth->id);

            http_response_code(200);
            echo json_encode($leaves);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function delete_leave() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->leave_id)) {
                throw new ValidationException("Leave ID is required.");
            }

            $this->doctorRepo->deleteLeave($data->leave_id, $auth->id);

            http_response_code(200);
            echo json_encode(["message" => "Leave cancelled successfully. You are now available on this date."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>