<?php
require_once __DIR__ . '/../exceptions/ValidationException.php';

class CertificateValidator {
    public static function validateRequest($startDate, $endDate, $reason, $hasFile) {
        if (empty($startDate) || empty($endDate) || empty($reason) || !$hasFile) {
            throw new ValidationException("All fields and proof file are required.");
        }
    }

    public static function validateReview($data) {
        if (empty($data->certificate_id) || empty($data->status)) {
            throw new ValidationException("Certificate ID and status are required.");
        }
    }
}
?>
