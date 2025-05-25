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
        'message' => 'Please use POST method'
    ]);
    exit;
}

$postData = json_decode(file_get_contents('php://input'), true);
if (!$postData) {
    $postData = $_POST;
}

// verify
$requiredFields = ['vin', 'customer_name', 'phone', 'email', 'license', 'start_date', 'rental_period_days'];
$missingFields = [];

foreach ($requiredFields as $field) {
    if (!isset($postData[$field]) || empty($postData[$field])) {
        $missingFields[] = $field;
    }
}

if (!empty($missingFields)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing information: ' . implode(', ', $missingFields)
    ]);
    exit;
}

//Verify
$car = getCarByVin($postData['vin']);
if (!$car) {
    http_response_code(404);
    echo json_encode([
        'status' => 'error',
        'message' => 'Cannot find car with this VIN'
    ]);
    exit;
}

if (!$car['availability']) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'It is not available now'
    ]);
    exit;
}

// total price
$pricePerDay = $car['price_per_day'];
$rentalPeriod = (int)$postData['rental_period_days'];
$totalPrice = $pricePerDay * $rentalPeriod;

// creat order
$orderData = [
    'vin' => $postData['vin'],
    'customer_name' => $postData['customer_name'],
    'phone' => $postData['phone'],
    'email' => $postData['email'],
    'license' => $postData['license'],
    'start_date' => $postData['start_date'],
    'rental_period_days' => $rentalPeriod,
    'total_price' => $totalPrice
];

$orderId = createOrder($orderData);
if (!$orderId) {
    http_response_code(500);
    echo json_encode([
        'status' => 'error',
        'message' => 'Cannot create order'
    ]);
    exit;
}

$updatedCar = updateCarAvailability($postData['vin'], false);
if (!$updatedCar) {
    // Check if the car is still available (another user might have booked it)
    $currentCar = getCarByVin($postData['vin']);
    if ($currentCar && !$currentCar['availability']) {
        // Car was booked by another user
        http_response_code(400);
        echo json_encode([
            'status' => 'error',
            'message' => 'It is not available now'
        ]);
    } else {
        // Other error occurred
        http_response_code(500);
        echo json_encode([
            'status' => 'error',
            'message' => 'Failed to update the car status'
        ]);
    }
    exit;
}

echo json_encode([
    'status' => 'success',
    'message' => 'Order submitted, waiting for confirmation',
    'data' => [
        'order_id' => $orderId,
        'total_price' => $totalPrice
    ]
]); 
