<?php
class UploadHelper {
    /**
     * Upload a file to the specified directory.
     *
     * @param array $file The $_FILES entry (e.g., $_FILES['proof_pdf'])
     * @param string $targetDir Absolute path to the target directory
     * @param string $prefix Optional filename prefix (e.g., 'profile_', 'sig_')
     * @return string|false The generated filename on success, false on failure
     */
    public static function uploadFile($file, $targetDir, $prefix = '') {
        if (!file_exists($targetDir)) {
            mkdir($targetDir, 0777, true);
        }

        $file_extension = pathinfo($file["name"], PATHINFO_EXTENSION);
        $file_name = $prefix . uniqid() . "." . $file_extension;
        $target_file = $targetDir . $file_name;

        if (move_uploaded_file($file["tmp_name"], $target_file)) {
            return $file_name;
        }

        return false;
    }
}
?>
