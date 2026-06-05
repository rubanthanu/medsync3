<?php
class ResponseHelper {
    public static function success($data, $statusCode = 200) {
        http_response_code($statusCode);
        echo json_encode($data);
    }

    public static function error($message, $statusCode = 400) {
        http_response_code($statusCode);
        echo json_encode(["message" => $message]);
    }
}
?>
