<?php
require_once '../includes/functions.php';
header('Content-Type: application/json');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

$query = isset($_GET['query']) ? trim($_GET['query']) : '';

$suggestions = getSearchSuggestions($query);

echo json_encode([
    'status' => 'success',
    'data' => $suggestions
]); 