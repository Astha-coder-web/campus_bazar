<?php
header('Content-Type: application/json');
require_once '../config/db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $name = $conn->real_escape_string($data['name']);
    $category = $conn->real_escape_string($data['category']);
    $description = $conn->real_escape_string($data['description']);
    $price = floatval($data['price']);
    $seller_id = intval($data['seller_id']);
    $image_url = $conn->real_escape_string($data['image_url']);
    
    $sql = "INSERT INTO products (name, category, description, price, seller_id, image_url) 
            VALUES ('$name', '$category', '$description', $price, $seller_id, '$image_url')";
    
    if ($conn->query($sql)) {
        echo json_encode(['success' => true, 'message' => 'Product added successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to add product']);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $sql = "SELECT p.*, u.name as seller_name, u.email as seller_contact 
            FROM products p 
            JOIN users u ON p.seller_id = u.id 
            ORDER BY p.created_at DESC";
    
    $result = $conn->query($sql);
    $products = [];
    
    while ($row = $result->fetch_assoc()) {
        $products[] = $row;
    }
    
    echo json_encode(['success' => true, 'products' => $products]);
}

$conn->close();
?>