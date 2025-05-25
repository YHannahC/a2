<?php
require_once 'includes/functions.php';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reservation - TT CAR RENT</title>
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
            <h1 class="page-title">Reservation</h1>
            
            <div class="reservation-layout">
                <div id="selected-car-container" class="selected-car-container">
                    <!-- Selected car will be dynamically loaded through JS -->
                </div>
                
                <div id="reservation-form-container" class="reservation-form-container" style="display: none;">
                    <h2 class="reservation-form-title">Reservation Details</h2>
                    
                    <form id="reservation-form" class="reservation-form">
                        <input type="hidden" id="car-vin" name="car-vin" value="">
                        
                        <div class="form-group">
                            <label for="customer-name" class="form-label">Full Name</label>
                            <input type="text" id="customer-name" name="customer-name" class="form-input" required>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="phone-number" class="form-label">Phone Number</label>
                            <input type="tel" id="phone-number" name="phone-number" class="form-input" 
                                   placeholder="0412345678" pattern="^0[0-9]{9}$" 
                                   title="Please enter a 10-digit Australian phone number starting with 0" required>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="email" class="form-label">Email Address</label>
                            <input type="email" id="email" name="email" class="form-input" required>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="license" class="form-label">Driver's License Number</label>
                            <input type="text" id="license" name="license" class="form-input" required>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="start-date" class="form-label">Start Date</label>
                            <input type="date" id="start-date" name="start-date" class="form-input" required>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="rental-period" class="form-label">Rental Period (days)</label>
                            <input type="number" id="rental-period" name="rental-period" class="form-input" min="1" value="1" required>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="form-group">
                            <label for="end-date" class="form-label">Return Date</label>
                            <input type="date" id="end-date" name="end-date" class="form-input" readonly>
                            <div class="form-error-message"></div>
                        </div>
                        
                        <div class="total-price-container">
                            <div class="total-price-title">Total Price</div>
                            <div id="total-price" class="total-price-value">$0.00</div>
                            <div id="price-detail" class="price-detail">Please select rental period</div>
                        </div>
                        
                        <div class="form-buttons">
                            <button type="submit" id="submit-btn" class="submit-btn disabled" disabled>Submit Order</button>
                            <button type="button" id="cancel-btn" class="cancel-btn">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
            
            <div id="loading-indicator" class="loading-indicator">
                <div class="loading-spinner"></div>
            </div>
        </div>
    </main>
    
    <script src="js/reservation.js"></script>
</body>
</html> 