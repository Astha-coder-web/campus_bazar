<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once '../config/db_config.php';

// Only allow POST method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Get POST data
$data = json_decode(file_get_contents('php://input'), true);

// Validate input
if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(['success' => false, 'message' => 'Missing email or password']);
    exit;
}

// Clean input
$email = $conn->real_escape_string($data['email']);
$password = $data['password'];

// Check user exists
$sql = "SELECT id, name, email, password FROM users WHERE email = '$email' LIMIT 1";
$result = $conn->query($sql);

if (!$result || $result->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'User not found']);
    $conn->close();
    exit;
}

// Verify password
$user = $result->fetch_assoc();
if (!password_verify($password, $user['password'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid credentials']);
    $conn->close();
    exit;
}

// Success - return user data
unset($user['password']);
echo json_encode(['success' => true, 'user' => $user]);
$conn->close();
?>