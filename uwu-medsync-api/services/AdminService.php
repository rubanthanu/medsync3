<?php
require_once __DIR__ . '/../repositories/UserRepository.php';
require_once __DIR__ . '/../repositories/AppointmentRepository.php';
require_once __DIR__ . '/../repositories/CertificateRepository.php';
require_once __DIR__ . '/../repositories/PrescriptionRepository.php';
require_once __DIR__ . '/../services/AuthService.php';
require_once __DIR__ . '/../exceptions/ValidationException.php';

class AdminService {
    private $conn;
    private $userRepo;
    private $appointmentRepo;
    private $certificateRepo;
    private $prescriptionRepo;
    private $authService;

    public function __construct($conn) {
        $this->conn = $conn;
        $this->userRepo = new UserRepository($conn);
        $this->appointmentRepo = new AppointmentRepository($conn);
        $this->certificateRepo = new CertificateRepository($conn);
        $this->prescriptionRepo = new PrescriptionRepository($conn);
        $this->authService = new AuthService($conn);
    }

    public function getStats() {
        $stats = [];
        $stats['total_appointments'] = $this->appointmentRepo->getTotalCount();
        $stats['total_patients'] = $this->userRepo->getTotalPatients();
        $stats['total_certificates'] = $this->certificateRepo->getTotalCount();
        $stats['total_prescriptions'] = $this->prescriptionRepo->getTotalCount();
        return $stats;
    }

    public function getUsers() {
        return $this->userRepo->getAllUsersWithRoles();
    }

    public function updateUserStatus($userId, $status) {
        $this->userRepo->updateStatus($userId, $status);
    }

    public function createUser($data) {
        if (empty($data->full_name) || empty($data->email) || empty($data->password) || empty($data->role_id)) {
            throw new ValidationException("All fields are required.");
        }

        return $this->authService->createUser($data);
    }

    public function getAppointmentWindows() {
        return $this->appointmentRepo->getAllWindows();
    }

    public function updateWindowSlots($windowId, $maxSlots) {
        $this->appointmentRepo->updateWindowSlots($windowId, $maxSlots);
    }
}
?>
