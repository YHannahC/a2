<?php
require_once '../includes/functions.php';
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'plz use POST'
    ]);
    exit;
}

$postData = json_decode(file_get_contents('php://input'), true);
if (!$postData) {
    $postData = $_POST;
}

$orderId = isset($postData['order_id']) ? trim($postData['order_id']) : '';
if(empty($orderId)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => '缺少订单ID'
    ]);
    exit;
}

// get order
$orders = getOrders();
$orderFound = false;

// check order
foreach($orders as $order) {
    if($order['order_id'] === $orderId) {
        $orderFound = true;
        if($order['status'] === 'confirmed') {
            http_response_code(400);
            echo json_encode([
                'status' => 'error',
                'message' => '该订单已经确认过了'
            ]);
            exit;
        }
        break;
    }
}

if(!$orderFound) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'cannotfindorder'
    ]);
    exit;
}

// update
$updated = updateOrderStatus($orderId, 'confirmed');
if(!$updated) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'fail'
    ]);
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'order updated',
    'data' => [
        'order_id' => $orderId
    ]
]); 