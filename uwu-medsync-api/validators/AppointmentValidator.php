<?php
require_once __DIR__ . '/../exceptions/ValidationException.php';

class AppointmentValidator {
    public static function validateBook($data) {
        if (empty($data->window_id) || empty($data->appointment_date)) {
            throw new ValidationException("Window ID and date are required.");
        }

        $today = date('Y-m-d');
        $max_date = date('Y-m-d', strtotime('+2 days'));
        if ($data->appointment_date < $today || $data->appointment_date > $max_date) {
            throw new ValidationException("Appointments can only be booked for today or the next 2 days.");
        }
    }

    public static function validateStaffBook($data) {
        if (empty($data->email) || empty($data->window_id) || empty($data->appointment_date)) {
            throw new ValidationException("Email, window ID and date are required.");
        }
    }

    public static function validateCancel($data) {
        if (empty($data->appointment_id)) {
            throw new ValidationException("Appointment ID is required.");
        }
    }
}
?>
