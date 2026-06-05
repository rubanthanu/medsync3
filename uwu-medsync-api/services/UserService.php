<?php
require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../repositories/PatientRepository.php';
require_once __DIR__ . '/../repositories/DoctorRepository.php';
require_once __DIR__ . '/../helpers/UploadHelper.php';
require_once __DIR__ . '/../exceptions/NotFoundException.php';

class UserService {
    private $conn;
    private $userRepo;
    private $patientRepo;
    private $doctorRepo;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->userRepo = new UserRepository($conn);
        $this->patientRepo = new PatientRepository($conn);
        $this->doctorRepo = new DoctorRepository($conn);
    }

    public function completeProfile($userId, $data) {
        $this->conn->beginTransaction();
        try {
            // Update users table
            $this->userRepo->updateBasicProfile(
                $userId,
                $data->full_name ?? null,
                $data->phone,
                $data->gender,
                $data->date_of_birth,
                $data->address
            );

            // Update patients table
            $this->patientRepo->updateProfile(
                $userId,
                $data->university_id,
                $data->blood_group,
                $data->allergies ?? null,
                $data->medical_conditions ?? null,
                $data->emergency_contact_name,
                $data->emergency_contact_phone
            );

            // Profile log
            $this->userRepo->createProfileLog($userId, 'Profile Completed');

            $this->conn->commit();
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function getProfile($userId) {
        // Fetch user basic details
        $user = $this->userRepo->findById($userId);
        if (!$user) {
            throw new NotFoundException("User not found.");
        }

        // Fetch role specific details
        $role_id = $user['role_id'];
        if ($role_id == 4) { // Patient
            $patient = $this->patientRepo->getPatientDetails($userId);
            if ($patient) {
                $user = array_merge($user, $patient);
            }
        } else if ($role_id == 2) { // Doctor
            $doctor = $this->doctorRepo->getDoctorDetails($userId);
            if ($doctor) {
                $user = array_merge($user, $doctor);
            }
        }

        return $user;
    }

    public function updateProfile($userId, $roleId, $data, $files) {
        $this->conn->beginTransaction();
        try {
            // Handle profile image upload if any
            $profile_image = null;
            if (isset($files['profile_image']) && $files['profile_image']['error'] == UPLOAD_ERR_OK) {
                $target_dir = __DIR__ . "/../uploads/profiles/";
                $file_extension = pathinfo($files["profile_image"]["name"], PATHINFO_EXTENSION);
                $file_name = "profile_" . $userId . "_" . time() . "." . $file_extension;

                if (!file_exists($target_dir)) {
                    mkdir($target_dir, 0777, true);
                }

                if (move_uploaded_file($files["profile_image"]["tmp_name"], $target_dir . $file_name)) {
                    $profile_image = "uploads/profiles/" . $file_name;
                }
            }

            // Update basic users details
            $this->userRepo->updateBasicProfile(
                $userId,
                $data->full_name,
                $data->phone,
                $data->gender,
                $data->date_of_birth,
                $data->address,
                $profile_image
            );

            // Update role specific details
            if ($roleId == 4) { // Patient
                $this->patientRepo->updateProfile(
                    $userId,
                    $data->university_id,
                    $data->blood_group,
                    $data->allergies,
                    $data->medical_conditions,
                    $data->emergency_contact_name,
                    $data->emergency_contact_phone
                );
            } else if ($roleId == 2) { // Doctor
                // Handle digital signature upload if any
                $digital_signature = null;
                if (isset($files['digital_signature']) && $files['digital_signature']['error'] == UPLOAD_ERR_OK) {
                    $target_dir = __DIR__ . "/../uploads/signatures/";
                    $file_extension = pathinfo($files["digital_signature"]["name"], PATHINFO_EXTENSION);
                    $file_name = "sig_" . $userId . "_" . time() . "." . $file_extension;

                    if (!file_exists($target_dir)) {
                        mkdir($target_dir, 0777, true);
                    }

                    if (move_uploaded_file($files["digital_signature"]["tmp_name"], $target_dir . $file_name)) {
                        $digital_signature = "uploads/signatures/" . $file_name;
                    }
                }

                $this->doctorRepo->updateSpecialization($userId, $data->specialization, $digital_signature);
            }

            // Profile log
            $this->userRepo->createProfileLog($userId, 'Profile Updated');

            $this->conn->commit();

            // Get updated values to return
            $updated_image = $profile_image;
            if (!$updated_image) {
                $updated_image = $this->userRepo->getProfileImage($userId);
            }

            // Update Auth Session if user full_name changed
            if (session_id() == '') {
                session_start();
            }
            $_SESSION['user']['full_name'] = $data->full_name;
            $_SESSION['user']['profile_image'] = $updated_image;

            return [
                'profile_image' => $updated_image,
                'full_name' => $data->full_name
            ];
        } catch (Exception $e) {
            $this->conn->rollBack();
            throw $e;
        }
    }

    public function getPatientDetails($patientId) {
        $patient = $this->patientRepo->findById($patientId);
        if (!$patient) {
            throw new NotFoundException("Patient not found.");
        }
        return $patient;
    }
}
?>
