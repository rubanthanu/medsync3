<?php
class AuthMiddleware {
    public static function authenticate() {
        if (isset($_SESSION['user']) && !empty($_SESSION['user'])) {
            // Return user object as stdClass so it behaves like the decoded JWT token used to
            return (object) $_SESSION['user'];
        }
        
        http_response_code(401);
        echo json_encode(array("message" => "Access denied. Not authenticated."));
        exit();
    }
}
?>
