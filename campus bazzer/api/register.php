<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string(trim($data['name'] ?? ''));
    $email = $conn->real_escape_string(trim($data['email'] ?? ''));
    $password_raw = $data['password'] ?? '';

    if (!$name || !$email || !$password_raw) {
        echo json_encode(['success' => false, 'message' => 'Missing fields']);
        exit;
    }

    // check duplicate email
    $checkSql = "SELECT id FROM users WHERE email = '$email' LIMIT 1";
    $checkRes = $conn->query($checkSql);
    if ($checkRes && $checkRes->num_rows > 0) {
        echo json_encode(['success' => false, 'message' => 'Email already registered']);
        exit;
    }

    $password = password_hash($password_raw, PASSWORD_DEFAULT);
    $sql = "INSERT INTO users (name, email, password) VALUES ('$name', '$email', '$password')";
    
    if ($conn->query($sql)) {
        $id = $conn->insert_id;
        echo json_encode(['success' => true, 'message' => 'User registered successfully', 'user' => ['id' => (int)$id, 'name' => $name, 'email' => $email]]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Registration failed']);
    }
    $conn->close();
} else {
    // Return error for non-POST requests
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>