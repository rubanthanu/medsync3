<?php
require_once __DIR__ . '/../exceptions/ValidationException.php';

class AuthValidator {
    public static function validateRegister($data) {
        if (empty($data->full_name) || empty($data->email) || empty($data->password)) {
            throw new ValidationException("All fields are required.");
        }

        if (!str_ends_with($data->email, '@std.uwu.ac.lk') && !str_ends_with($data->email, '@uwu.ac.lk')) {
            throw new ValidationException("Please use a valid university email (@std.uwu.ac.lk or @uwu.ac.lk).");
        }
    }

    public static function validateLogin($data) {
        if (empty($data->email) || empty($data->password)) {
            throw new ValidationException("Email and password are required.");
        }
    }

    public static function validateOtp($data) {
        if (empty($data->email) || empty($data->otp)) {
            throw new ValidationException("Email and OTP are required.");
        }
    }

    public static function validateResendOtp($data) {
        if (empty($data->email) || empty($data->type)) {
            throw new ValidationException("Email and type are required.");
        }
    }

    public static function validateForgotPassword($data) {
        if (empty($data->email)) {
            throw new ValidationException("Email is required.");
        }
    }

    public static function validateResetPassword($data) {
        if (empty($data->email) || empty($data->otp) || empty($data->new_password)) {
            throw new ValidationException("Email, OTP and new password are required.");
        }
    }

    public static function validateChangePassword($data) {
        if (empty($data->current_password) || empty($data->new_password)) {
            throw new ValidationException("Current and new password are required.");
        }
    }
}
?>
