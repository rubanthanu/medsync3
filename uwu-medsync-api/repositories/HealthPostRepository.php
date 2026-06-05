<?php
class HealthPostRepository {
    private $conn;

    public function __construct($conn) {
        $this->conn = $conn;
    }

    public function getAll() {
        $query = "SELECT hp.*, u.full_name as author_name 
                  FROM health_posts hp 
                  JOIN users u ON hp.uploaded_by = u.user_id 
                  ORDER BY hp.created_at DESC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function create($userId, $title, $content, $category, $imageUrl) {
        $query = "INSERT INTO health_posts (uploaded_by, title, content, category, image_url) VALUES (:user_id, :title, :content, :category, :image_url)";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $userId);
        $stmt->bindParam(":title", $title);
        $stmt->bindParam(":content", $content);
        $stmt->bindParam(":category", $category);
        $stmt->bindParam(":image_url", $imageUrl);
        $stmt->execute();
        return $this->conn->lastInsertId();
    }

    public function findById($postId) {
        $query = "SELECT uploaded_by FROM health_posts WHERE post_id = :post_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":post_id", $postId);
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function delete($postId) {
        $query = "DELETE FROM health_posts WHERE post_id = :post_id";
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":post_id", $postId);
        $stmt->execute();
    }
}
?>
