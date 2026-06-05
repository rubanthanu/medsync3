<?php
require_once __DIR__ . '/../exceptions/ValidationException.php';

class PrescriptionValidator {
    public static function validateCreate($data) {
        if (empty($data->appointment_id) || empty($data->medicines)) {
            throw new ValidationException("Appointment ID and Medicines are required.");
        }
    }
}
?>
