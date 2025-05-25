<?php
require_once 'includes/functions.php';

$carTypes = getAllCarTypes();
$carBrands = getAllCarBrands();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TT CAR RENT - Find Your Perfect Rental Car</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <header>
        <div class="container header-container">
            <a href="index.php" class="logo">
                <img src="img/logo.svg" alt="TT CAR RENT" class="logo-image">
                <div class="logo-text">TT CAR RENT</div>
            </a>
            <div class="nav-links">
                <a href="index.php" class="nav-item">
                    Home
                </a>
                <a href="reservation.php" class="nav-item">
                    Reservation
                </a>
            </div>
        </div>
    </header>
    
    <main class="main-content">
        <div class="container">
            <h1 class="page-title">Find Your Perfect Rental Car</h1>
            
            <div class="search-container">
                <div class="search-box">
                    <input type="text" id="search-input" class="search-input" placeholder="Search by car type, brand, model...">
                    <button id="search-button" class="search-button">Search</button>
                </div>
                <div id="suggestions-container" class="suggestions-container"></div>
            </div>
            
            <div class="content-layout">
                <aside class="filters-container">
                    <h2 class="filters-title">Filters</h2>
                    
                    <div class="filter-group">
                        <label class="filter-label">Car Type</label>
                        <?php 
                        // Traverse all types
                        foreach ($carTypes as $type): ?>
                        <div class="filter-option">
                            <input type="checkbox" name="car-type" id="type-<?= strtolower($type) ?>" value="<?= $type ?>" class="filter-checkbox">
                            <label for="type-<?= strtolower($type) ?>"><?= $type ?></label>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <div class="filter-group">
                        <label class="filter-label">Car Brand</label>
                        <?php 
                        // brands are also generated through cycles
                        foreach ($carBrands as $brand): ?>
                        <div class="filter-option">
                            <input type="checkbox" name="car-brand" id="brand-<?= strtolower($brand) ?>" value="<?= $brand ?>" class="filter-checkbox">
                            <label for="brand-<?= strtolower($brand) ?>"><?= $brand ?></label>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    
                    <div class="filter-buttons">
                        <button id="filter-button" class="filter-button">Apply Filters</button>
                        <button id="clear-filter-button" class="clear-filter-button">Clear Filters</button>
                    </div>
                </aside>
                
                <div class="cars-grid-container">
                    <div id="cars-grid" class="cars-grid">
                        <!-- car list is loaded by JS. leave it blank here -->
                    </div>
                    
                    <div id="loading-indicator" class="loading-indicator">
                        <div class="loading-spinner"></div>
                    </div>
                </div>
            </div>
        </div>
    </main>
    
    <script src="js/main.js"></script>
</body>
</html> 