<?php
class AppointmentException extends Exception {
    public function __construct($message = "Appointment error.", $code = 400) {
        parent::__construct($message, $code);
    }
}
?>
