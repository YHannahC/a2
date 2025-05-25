<?php
require_once '../includes/functions.php';
header('Content-Type: application/json');

// Alas, I have to add these every time
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);  // preflight return the request
}

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

$selectedTypes = isset($_GET['type']) ? (array)$_GET['type'] : [];
$selectedBrands = isset($_GET['brand']) ? (array)$_GET['brand'] : [];

$cars = getCars();

// ketword ssearch
if (!empty($keyword)) {
    $cars = searchCars($keyword);
}

if (!empty($selectedTypes) || !empty($selectedBrands)) {
    $cars = filterCarsByMultiple($cars, $selectedTypes, $selectedBrands);
}

// solve the error of "cars.forEach is not a function" in JS
$cars = array_values($cars);

// Return result use array_values, forEach on the js cannot be used
echo json_encode([
    'status' => 'success',
    'data' => $cars
]); 