<?php
class ValidationException extends Exception {
    public function __construct($message = "Validation failed.", $code = 400) {
        parent::__construct($message, $code);
    }
}
?>
