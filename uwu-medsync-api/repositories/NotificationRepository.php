<?php
class NotificationRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function create($userId, $message, $type) {
        $query = "INSERT INTO notifications (user_id, message, notification_type) VALUES (:uid, :msg, :type)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":uid", $userId);
        $stmt->bindParam(":msg", $message);
        $stmt->bindParam(":type", $type);
        $stmt->execute();
    }

    public function getAll($userId) {
        $query = "SELECT * FROM notifications WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function markRead($notificationId, $userId) {
        $query = "UPDATE notifications SET is_read = 1 WHERE notification_id = :notification_id AND user_id = :user_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":notification_id", $notificationId);
        $stmt->bindParam(":user_id", $userId);
        $stmt->execute();
    }

    public function createByEmail($email, $message, $type) {
        $query = "INSERT INTO notifications (user_id, message, notification_type) 
                  SELECT user_id, :msg, :type 
                  FROM users WHERE email = :email";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":msg", $message);
        $stmt->bindParam(":type", $type);
        $stmt->bindParam(":email", $email);
        $stmt->execute();
    }
}
?>
