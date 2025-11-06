<?php
header('Content-Type: application/json');
require_once '../config/db_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$name = $conn->real_escape_string(trim($data['name'] ?? ''));
$contact = $conn->real_escape_string(trim($data['contact'] ?? ''));
$message = $conn->real_escape_string(trim($data['message'] ?? ''));

if (!$name || !$contact || !$message) {
    echo json_encode(['success' => false, 'message' => 'Missing fields']);
    exit;
}

$sql = "INSERT INTO contact_messages (name, contact, message) VALUES ('$name', '$contact', '$message')";
if ($conn->query($sql)) {
    echo json_encode(['success' => true, 'message' => 'Message recorded']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to record message']);
}

$conn->close();
?>
