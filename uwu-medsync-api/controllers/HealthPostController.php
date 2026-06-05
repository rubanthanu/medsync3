<?php
require_once __DIR__ . '/BaseController.php';
require_once __DIR__ . '/../middleware/AuthMiddleware.php';
require_once __DIR__ . '/../repositories/HealthPostRepository.php';

class HealthPostController extends BaseController {

    private $healthPostRepo;

    public function __construct() {
        parent::__construct();
        $this->healthPostRepo = new HealthPostRepository($this->conn);
    }

    public function get_all() {
        try {
            $posts = $this->healthPostRepo->getAll();

            http_response_code(200);
            echo json_encode($posts);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function create() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 1 && $auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->title) || empty($data->content)) {
                throw new ValidationException("Title and content are required.");
            }

            $category = !empty($data->category) ? $data->category : 'Wellness';
            $image_url = !empty($data->image_url) ? $data->image_url : null;

            $this->healthPostRepo->create($auth->id, $data->title, $data->content, $category, $image_url);

            http_response_code(201);
            echo json_encode(["message" => "Health post created successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }

    public function delete() {
        try {
            $auth = AuthMiddleware::authenticate();
            if ($auth->role_id != 1 && $auth->role_id != 2) {
                throw new PermissionException("Unauthorized access.");
            }

            $data = json_decode(file_get_contents("php://input"));
            if (empty($data->post_id)) {
                throw new ValidationException("Post ID is required.");
            }

            // Doctors can only delete their own posts, Admins can delete any post
            if ($auth->role_id == 2) {
                $post = $this->healthPostRepo->findById($data->post_id);
                if (!$post || $post['uploaded_by'] != $auth->id) {
                    throw new PermissionException("You are not authorized to delete this post.");
                }
            }

            $this->healthPostRepo->delete($data->post_id);

            http_response_code(200);
            echo json_encode(["message" => "Health post deleted successfully."]);
        } catch (Exception $e) {
            $this->handleException($e);
        }
    }
}
?>
