<?php
require_once __DIR__ . '/../repositories/NotificationRepository.php';

class NotificationService {
    private $notificationRepo;

    public function __construct($conn) {
        $this->notificationRepo = new NotificationRepository($conn);
    }

    public function create($userId, $message, $type) {
        $this->notificationRepo->create($userId, $message, $type);
    }

    public function getAll($userId) {
        return $this->notificationRepo->getAll($userId);
    }

    public function markRead($notificationId, $userId) {
        $this->notificationRepo->markRead($notificationId, $userId);
    }

    public function createByEmail($email, $message, $type) {
        $this->notificationRepo->createByEmail($email, $message, $type);
    }
}
?>
