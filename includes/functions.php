<?php
define('CARS_JSON_FILE', dirname(__DIR__) . '/data/cars.json');
define('ORDERS_JSON_FILE', dirname(__DIR__) . '/data/orders.json');

/**
 * get all car datas from file
 * @return array car data group
 */
function getCars() {
    $cars = [];
    if(file_exists(CARS_JSON_FILE)) {
        $jsonContent = file_get_contents(CARS_JSON_FILE);
        $cars = json_decode($jsonContent, true);
    }
    return $cars;
}

/**
 * find car by vin number
 * @param string $vin car vin code
 * @return array|null car data or null if cannot find
 */
function getCarByVin($vin) {
    $cars = getCars();
    foreach($cars as $car) {
        if($car['vin'] === $vin) {
            return $car;
        }
    }
    return null;
}

/**
 * change car available status
 * @param string $vin car vin code
 * @param bool $availability can use or not
 * @return bool update success or fail
 */
function updateCarAvailability($vin, $availability) {
    $cars = getCars();
    $updated = false;
    
    for($i = 0; $i < count($cars); $i++) {
        if($cars[$i]['vin'] === $vin) {
            $cars[$i]['availability'] = $availability;
            $updated = true;
            break;
        }
    }
    
    if($updated) {
        return file_put_contents(CARS_JSON_FILE, json_encode($cars, JSON_PRETTY_PRINT));
    }
    
    return false;
}

/**
 * get all order from file
 * @return array order data group
 */
function getOrders() {
    $orders = [];
    if(file_exists(ORDERS_JSON_FILE)) {
        $jsonContent = file_get_contents(ORDERS_JSON_FILE);
        $orders = json_decode($jsonContent, true);
    }
    return $orders;
}

/**
 * make new order
 * @param array $orderData order informations
 * @return bool|string return order ID if success, false if fail
 */
function createOrder($orderData) {
    $orders = getOrders();
    
    // make sure order ID is unique
    $orderId = 'ORD-' . date('Y') . str_pad(count($orders) + 1, 4, '0', STR_PAD_LEFT);
    $orderData['order_id'] = $orderId;
    $orderData['status'] = 'pending'; // first status is waiting confirm
    
    $orders[] = $orderData;
    
    if(file_put_contents(ORDERS_JSON_FILE, json_encode($orders, JSON_PRETTY_PRINT))) {
        return $orderId;
    }
    
    return false;
}

/**
 * change order status
 * @param string $orderId order ID number
 * @param string $status new status
 * @return bool update success or not
 */
function updateOrderStatus($orderId, $status) {
    $orders = getOrders();
    $updated = false;
    
    for($i = 0; $i < count($orders); $i++) {
        if($orders[$i]['order_id'] === $orderId) {
            $orders[$i]['status'] = $status;
            $updated = true;
            break;
        }
    }
    
    if($updated) {
        return file_put_contents(ORDERS_JSON_FILE, json_encode($orders, JSON_PRETTY_PRINT));
    }
    
    return false;
}

/**
 * get cars by type
 * @param string $type car type
 * @return array cars that match the type
 */
function getCarsByType($type) {
    $cars = getCars();
    return array_filter($cars, function($car) use ($type) {
        return $car['type'] === $type;
    });
}

/**
 * get cars by brand
 * @param string $brand car brand name
 * @return array cars that match the brand
 */
function getCarsByBrand($brand) {
    $cars = getCars();
    return array_filter($cars, function($car) use ($brand) {
        return $car['brand'] === $brand;
    });
}

/**
 * search car by keyword
 * @param string $keyword search keyword
 * @return array cars that match search condition
 */
function searchCars($keyword) {
    if(empty($keyword)) {
        return getCars();
    }
    
    $keyword = strtolower($keyword);
    $cars = getCars();
    
    return array_filter($cars, function($car) use ($keyword) {
        // search in type, brand, model and description
        return stripos($car['type'], $keyword) !== false ||
               stripos($car['brand'], $keyword) !== false ||
               stripos($car['model'], $keyword) !== false ||
               stripos($car['description'], $keyword) !== false;
    });
}

/**
 * get search suggestions from car data
 * @param string $query user input query string
 * @return array matching search suggestions
 */
function getSearchSuggestions($query) {
    if(empty($query)) {
        return [];
    }
    
    $query = strtolower($query);
    $cars = getCars();
    $suggestions = [];
    
    // collect all types, brands and models
    $types = [];
    $brands = [];
    $models = [];
    
    foreach($cars as $car) {
        $types[$car['type']] = true;
        $brands[$car['brand']] = true;
        $models[$car['model']] = true;
    }
    
    // first add matching types (with label)
    foreach(array_keys($types) as $type) {
        if(stripos($type, $query) !== false) {
            $suggestions[] = $type . ' (Type)';
        }
    }
    
    // then add matching brands
    foreach(array_keys($brands) as $brand) {
        if(stripos($brand, $query) !== false) {
            $suggestions[] = $brand;
        }
    }
    
    // finally add matching models
    foreach(array_keys($models) as $model) {
        if(stripos($model, $query) !== false) {
            $suggestions[] = $model;
        }
    }
    
    return array_unique($suggestions);
}

/**
 * filter cars by type and brand
 * @param array $cars car data array
 * @param string|null $type type to filter
 * @param string|null $brand brand to filter
 * @return array filtered car array
 */
function filterCars($cars, $type = null, $brand = null) {
    if(!$type && !$brand) {
        return $cars;
    }
    
    return array_filter($cars, function($car) use ($type, $brand) {
        $typeMatch = !$type || $car['type'] === $type;
        $brandMatch = !$brand || $car['brand'] === $brand;
        return $typeMatch && $brandMatch;
    });
}

/**
 * get all available car types
 * @return array type array
 */
function getAllCarTypes() {
    $cars = getCars();
    $types = [];
    
    foreach($cars as $car) {
        $types[$car['type']] = true;
    }
    
    return array_keys($types);
}

/**
 * get all available car brands
 * @return array brand array
 */
function getAllCarBrands() {
    $cars = getCars();
    $brands = [];
    
    foreach($cars as $car) {
        $brands[$car['brand']] = true;
    }
    
    return array_keys($brands);
}

/**
 * filter cars by multiple types and brands
 * @param array $cars car data array
 * @param array $types type array to filter
 * @param array $brands brand array to filter
 * @return array filtered car array
 */
function filterCarsByMultiple($cars, $types = [], $brands = []) {
    // if no filter condition, return all directly
    if (empty($types) && empty($brands)) {
        return $cars;
    }

    return array_filter($cars, function($car) use ($types, $brands) {
        $typeMatch = empty($types) || in_array($car['type'], $types);
        
        // maybe performance will be better if write separately like this?
        $brandMatch = empty($brands) || in_array($car['brand'], $brands);

        return $typeMatch && $brandMatch;
    });
} 