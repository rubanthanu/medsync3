<?php
class PermissionException extends Exception {
    public function __construct($message = "Unauthorized access.", $code = 403) {
        parent::__construct($message, $code);
    }
}
?>
