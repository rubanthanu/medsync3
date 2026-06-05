<?php
require_once __DIR__ . '/../config/database.php';

// Exceptions
require_once __DIR__ . '/../exceptions/ValidationException.php';
require_once __DIR__ . '/../exceptions/AuthException.php';
require_once __DIR__ . '/../exceptions/AppointmentException.php';
require_once __DIR__ . '/../exceptions/NotFoundException.php';
require_once __DIR__ . '/../exceptions/PermissionException.php';

// Helpers
require_once __DIR__ . '/../helpers/ResponseHelper.php';

abstract class BaseController {
    protected $conn;

    public function __construct() {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    protected function jsonResponse($statusCode, $data) {
        http_response_code($statusCode);
        echo json_encode($data);
    }

    protected function handleException($e) {
        if ($e instanceof ValidationException) {
            $this->jsonResponse($e->getCode() ?: 400, ["message" => $e->getMessage()]);
        } else if ($e instanceof AuthException) {
            $code = $e->getCode() ?: 401;
            $response = ["message" => $e->getMessage()];
            // Preserve requires_verification flag for specific auth errors
            if (strpos($e->getMessage(), 'not verified') !== false || strpos($e->getMessage(), 'verify your email') !== false) {
                $response["requires_verification"] = true;
            }
            $this->jsonResponse($code, $response);
        } else if ($e instanceof AppointmentException) {
            $this->jsonResponse($e->getCode() ?: 400, ["message" => $e->getMessage()]);
        } else if ($e instanceof NotFoundException) {
            $this->jsonResponse($e->getCode() ?: 404, ["message" => $e->getMessage()]);
        } else if ($e instanceof PermissionException) {
            $this->jsonResponse($e->getCode() ?: 403, ["message" => $e->getMessage()]);
        } else {
            $this->jsonResponse(500, ["message" => $e->getMessage()]);
        }
    }
}
?>