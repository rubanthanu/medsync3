<?php
require_once __DIR__ . '/../exceptions/ValidationException.php';

class UserValidator {
    public static function validateCompleteProfile($data) {
        if (empty($data->university_id) || empty($data->phone) || empty($data->gender) || 
           empty($data->date_of_birth) || empty($data->address) || empty($data->blood_group) || 
           empty($data->emergency_contact_name) || empty($data->emergency_contact_phone)) {
            throw new ValidationException("Please fill in all required fields.");
        }

        self::validatePhoneFormat($data->phone, "Phone number");
        self::validatePhoneFormat($data->emergency_contact_phone, "Emergency contact phone");
    }

    public static function validateUpdateProfile($data) {
        if (isset($data->phone) && !empty($data->phone)) {
            self::validatePhoneFormat($data->phone, "Phone number");
        }
        if (isset($data->emergency_contact_phone) && !empty($data->emergency_contact_phone)) {
            self::validatePhoneFormat($data->emergency_contact_phone, "Emergency contact phone");
        }
    }

    private static function validatePhoneFormat($phone, $fieldName) {
        // Remove all non-digit characters to count digits
        $digitsOnly = preg_replace('/[^0-9]/', '', $phone);
        
        if (strlen($digitsOnly) !== 10) {
            throw new ValidationException("{$fieldName} must be exactly 10 digits.");
        }
    }
}
?>
