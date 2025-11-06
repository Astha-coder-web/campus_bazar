<?php
header('Content-Type: application/json');
require_once '../config/db_config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$id = intval($data['id'] ?? 0);
$seller_id = intval($data['seller_id'] ?? 0);

if (!$id || !$seller_id) {
    echo json_encode(['success' => false, 'message' => 'Missing parameters']);
    exit;
}

// Verify product exists and belongs to seller
$checkSql = "SELECT seller_id FROM products WHERE id = $id LIMIT 1";
$res = $conn->query($checkSql);
if (!$res || $res->num_rows === 0) {
    echo json_encode(['success' => false, 'message' => 'Product not found']);
    exit;
}

$row = $res->fetch_assoc();
if (intval($row['seller_id']) !== $seller_id) {
    echo json_encode(['success' => false, 'message' => 'Not authorized to delete this product']);
    exit;
}

$delSql = "DELETE FROM products WHERE id = $id";
if ($conn->query($delSql)) {
    echo json_encode(['success' => true, 'message' => 'Product deleted']);
} else {
    echo json_encode(['success' => false, 'message' => 'Failed to delete product']);
}

$conn->close();
?>
