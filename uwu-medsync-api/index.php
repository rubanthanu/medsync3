<?php
require_once __DIR__ . '/vendor/autoload.php';
$allowed_origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : 'http://localhost:5173';
header("Access-Control-Allow-Origin: $allowed_origin");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

date_default_timezone_set('Asia/Colombo');

session_start();

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$request = isset($_GET['request']) ? $_GET['request'] : '';
$uri = explode('/', rtrim($request, '/'));

$controllerName = isset($uri[0]) && $uri[0] != '' ? ucfirst($uri[0]) . 'Controller' : null;
$methodName = isset($uri[1]) ? $uri[1] : null;

if ($controllerName && file_exists(__DIR__ . '/controllers/' . $controllerName . '.php')) {
    require_once __DIR__ . '/controllers/' . $controllerName . '.php';
    $controller = new $controllerName();
    
    if ($methodName && method_exists($controller, $methodName)) {
        // Pass the remaining URI parts as arguments
        $args = array_slice($uri, 2);
        call_user_func_array([$controller, $methodName], $args);
    } else {
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found."]);
    }
} else {
    http_response_code(404);
    echo json_encode(["message" => "Controller not found."]);
}
?>
