<?php
require_once '../includes/functions.php';
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$vin = isset($_GET['vin']) ? trim($_GET['vin']) : '';

if(empty($vin)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'lostvin'
    ]);
    exit;
}

//It shouldn't be too slow to look for a car
$car = getCarByVin($vin);

if(!$car) {
    http_response_code(404); // if connot find
    echo json_encode([
        'status' => 'error',
        'message' => 'canfindvincar'
    ]);
    exit;
}

// All okay. Let's return the data
echo json_encode([
    'status' => 'success',
    'data' => $car
]); 