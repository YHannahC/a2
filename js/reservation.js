document.addEventListener('DOMContentLoaded', function() {
    // Check if there's a selected car vin
    const selectedVin = sessionStorage.getItem('selected_vin');
    
    if (selectedVin) {
        loadCarDetails(selectedVin);
    } else {
        showNoCarSelectedMessage();
    }

    loadFormDataFromStorage();

    setupFormValidation();

    setTimeout(() => {
        calculateEndDate();
        updateEndDateConstraints();
    }, 100);

    const cancelButton = document.getElementById('cancel-btn');
    if (cancelButton) {
        cancelButton.addEventListener('click', function(e) {
            e.preventDefault();
            clearFormData();
            window.location.href = 'index.php';
        });
    }
});

/**
 * Load selected car details
 * @param {string} vin - Car vincode
 */
function loadCarDetails(vin) {
    const selectedCarContainer = document.getElementById('selected-car-container');
    const reservationFormContainer = document.getElementById('reservation-form-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    fetch(`api/get_car_details.php?vin=${encodeURIComponent(vin)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response not OK');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                const car = data.data;
                
                // Check if car is still available
                if (car.availability) {
                    displaySelectedCar(car);
                    const vinInput = document.getElementById('car-vin');
                    if (vinInput) vinInput.value = car.vin;
                    
                    // show reservation form
                    if (reservationFormContainer) reservationFormContainer.style.display = 'block';
                } else {
                    // car is no longer available
                    displaySelectedCar(car);
                    showCarUnavailableMessage();
                }
            } else {
                displayError('Unable to load car details');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError('Request failed: ' + error.message);
        })
        .finally(() => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
}

/**
 * display selected car details
 * @param {Object} car - Car data
 */
function displaySelectedCar(car) {
    const selectedCarContainer = document.getElementById('selected-car-container');
    
    if (!selectedCarContainer) return;
    
    selectedCarContainer.innerHTML = `
        <h2 class="selected-car-title">Selected Car</h2>
        <img src="${car.image_url}" alt="${car.brand} ${car.model}" class="selected-car-image">
        <h3 class="selected-car-name">${car.brand} ${car.model}</h3>
        <p class="selected-car-description">${car.description}</p>
        <div class="selected-car-info">
            <div class="selected-car-info-item">Type: <span>${car.type}</span></div>
            <div class="selected-car-info-item">Year: <span>${car.year}</span></div>
            <div class="selected-car-info-item">Mileage: <span>${car.mileage} miles</span></div>
            <div class="selected-car-info-item">Fuel Type: <span>${car.fuel_type}</span></div>
        </div>
        <div class="selected-car-price">$${car.price_per_day}/day</div>
    `;
    
    // Save price for calculating total price
    const reservationForm = document.getElementById('reservation-form');
    if (reservationForm) {
        reservationForm.dataset.pricePerDay = car.price_per_day;
        // There is a bug here. The total price is shown as 0.
        // Set the total price for immediate update
        updateTotalPrice();
    }
}

/**
 * Show "no car selected" message
 */
function showNoCarSelectedMessage() {
    const mainContent = document.querySelector('.main-content .container');
    
    if (!mainContent) return;
    
    // clear existing content
    mainContent.innerHTML = `
        <div class="no-car-selected">
            <h2>You haven't selected a car yet</h2>
            <p>Please return to homepage to select a car you want to rent.</p>
            <a href="index.php" class="back-button">Return to Car Selection</a>
        </div>
    `;
}

/**
 * Show "car unavailable" message
 */
function showCarUnavailableMessage() {
    const reservationFormContainer = document.getElementById('reservation-form-container');
    
    if (!reservationFormContainer) return;
    
    reservationFormContainer.innerHTML = `
        <div class="car-unavailable">
            <h2>Sorry, this car is no longer available</h2>
            <p>This car may have been rented by another user.</p>
            <p>Please return to homepage to select another car.</p>
            <a href="index.php" class="back-button">Return to Car Selection</a>
        </div>
    `;
}

/**
 * Display error message
 * @param {string} message - Error message
 */
function displayError(message) {
    const mainContent = document.querySelector('.main-content .container');
    
    if (!mainContent) return;
    
    mainContent.innerHTML = `
        <div class="error-message">
            <h2>An error occurred</h2>
            <p>${message}</p>
            <a href="index.php" class="back-button">Return to Homepage</a>
        </div>
    `;
}

/**
 * Setup form validation
 */
function setupFormValidation() {
    const form = document.getElementById('reservation-form');
    
    if (!form) return;
    
    // Get form fields
    const nameInput = document.getElementById('customer-name');
    const phoneInput = document.getElementById('phone-number');
    const emailInput = document.getElementById('email');
    const licenseInput = document.getElementById('license');
    const startDateInput = document.getElementById('start-date');
    const periodInput = document.getElementById('rental-period');
    const endDateInput = document.getElementById('end-date');
    const submitButton = document.getElementById('submit-btn');
    
    // real-time validation
    const inputs = [nameInput, phoneInput, emailInput, licenseInput, startDateInput, periodInput];
    
    inputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                validateInput(this);
                saveFormDataToStorage();
                checkFormValidity();
                // If rental period input, update price calculation
                if (this.id === 'rental-period') {
                    updateTotalPrice();
                    calculateEndDate();
                }
                // If start date input, calculate end date
                if (this.id === 'start-date') {
                    calculateEndDate();
                }
            });
            
            input.addEventListener('blur', function() {
                validateInput(this);
            });
        }
    });

    if (endDateInput) {
        endDateInput.addEventListener('change', function() {
            validateInput(this);
            calculateRentalPeriod();
        });
        
        endDateInput.addEventListener('input', function() {
            validateInput(this);
        });

        endDateInput.readOnly = false;
    }

    if (periodInput) {
        periodInput.addEventListener('change', function() {
            if (parseInt(this.value) < 1) {
                this.value = 1;
            }
            updateTotalPrice();
            calculateEndDate();
        });
    }

    if (startDateInput) {
        const today = new Date().toISOString().split('T')[0];
        startDateInput.min = today;
        
        startDateInput.addEventListener('change', function() {
            calculateEndDate();
            // Update end date min constraint
            updateEndDateConstraints();
        });
    }
    
    // handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        let isValid = true;
        
        // valiy inputs
        inputs.forEach(input => {
            if (input && !validateInput(input)) {
                isValid = false;
            }
        });
        
        if (isValid) {
            submitReservation();
        } else {
            // Mark empty fields as error
            inputs.forEach(input => {
                if (input && input.value.trim() === '') {
                    input.classList.add('error');
                }
            });
            
            // Show tooltip on submit button
            const submitButton = document.getElementById('submit-btn');
            if (submitButton) {
                submitButton.title = 'Please complete the form.';
                submitButton.style.cursor = 'not-allowed';
                
                // Remove tooltip after 3 seconds
                setTimeout(() => {
                    submitButton.title = '';
                    submitButton.style.cursor = 'pointer';
                }, 3000);
            }
        }
    });
}

/**
 * Validate individual input
 * @param {HTMLElement} input - Input element
 * @returns {boolean} Whether valid
 */
function validateInput(input) {
    const value = input.value.trim();
    const errorMsg = input.nextElementSibling;
    let isValid = true;
    let errorText = '';

    input.classList.remove('error');
    if (errorMsg) errorMsg.style.display = 'none';
    
    // empty value check
    if (value === '') {
        isValid = false;
        errorText = 'This field cannot be empty';
    } else {
        switch (input.id) {
            case 'phone-number':
                // aus phone validation
                if (!/^0[0-9]{9}$/.test(value)) {
                    isValid = false;
                    errorText = 'Please enter Australian phone numbers starting with 0';
                }
                break;
            case 'email':
                // Email validation
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    isValid = false;
                    errorText = 'Please enter a valid email address';
                }
                break;
            case 'license':
                // License number validation
                if (value.length < 5) {
                    isValid = false;
                    errorText = 'Please enter a valid driver\'s license number';
                }
                break;
            case 'start-date':
                // Date validation
                const selectedDate = new Date(value);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    isValid = false;
                    errorText = 'Start date cannot be earlier than today';
                }
                break;
            case 'end-date':
                const startDateInput = document.getElementById('start-date');
                if (startDateInput && startDateInput.value) {
                    const startDate = new Date(startDateInput.value);
                    const endDate = new Date(value);
                    
                    if (endDate <= startDate) {
                        isValid = false;
                        errorText = 'Return date must be after start date';
                    }
                } else if (value) {
                    // If no start date is set but end date is chosen
                    isValid = false;
                    errorText = 'Please select start date first';
                }
                break;
            case 'rental-period':
                const period = parseInt(value);
                if (isNaN(period) || period < 1 || period > 30) {
                    isValid = false;
                    errorText = 'Please enter a rental period between 1-30 days';
                }
                break;
        }
    }
    
    // Show error message
    if (!isValid) {
        input.classList.add('error');
        if (errorMsg) {
            errorMsg.textContent = errorText;
            errorMsg.style.display = 'block';
        }
    }
    
    return isValid;
}

/**
 * Check entire form validity and enable/disable submit button
 */
function checkFormValidity() {
    const form = document.getElementById('reservation-form');
    const submitButton = document.getElementById('submit-btn');
    
    if (!form || !submitButton) return;
    
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (input.value.trim() === '') {
            isValid = false;
        }
        
        if (input.classList.contains('error')) {
            isValid = false;
        }
    });
    
    if (isValid) {
        submitButton.disabled = false;
        submitButton.classList.remove('disabled');
        updateTotalPrice();
    } else {
        submitButton.disabled = true;
        submitButton.classList.add('disabled');
    }
}

/**
 * Update total price
 */
function updateTotalPrice() {
    const form = document.getElementById('reservation-form');
    const periodInput = document.getElementById('rental-period');
    const totalPriceElement = document.getElementById('total-price');
    const priceDetailElement = document.getElementById('price-detail');
    
    if (!form || !periodInput || !totalPriceElement || !priceDetailElement) return;
    
    const pricePerDay = parseFloat(form.dataset.pricePerDay) || 0;
    const days = parseInt(periodInput.value) || 0;
    
    if (days >= 1) {
        const totalPrice = pricePerDay * days;
        totalPriceElement.textContent = `$${totalPrice.toFixed(2)}`;
        priceDetailElement.textContent = `$${pricePerDay} × ${days} days`;
    } else {
        totalPriceElement.textContent = '$0.00';
        priceDetailElement.textContent = 'Please select rental period';
    }
}

/**
 * Save form data to localStorage
 */
function saveFormDataToStorage() {
    const form = document.getElementById('reservation-form');
    
    if (!form) return;
    
    const formData = {
        customerName: document.getElementById('customer-name')?.value || '',
        phoneNumber: document.getElementById('phone-number')?.value || '',
        email: document.getElementById('email')?.value || '',
        license: document.getElementById('license')?.value || '',
        startDate: document.getElementById('start-date')?.value || '',
        rentalPeriod: document.getElementById('rental-period')?.value || '',
        endDate: document.getElementById('end-date')?.value || ''
    };
    
    localStorage.setItem('reservationFormData', JSON.stringify(formData));
}

/**
 * Load form data from localStorage
 */
function loadFormDataFromStorage() {
    const formDataJson = localStorage.getItem('reservationFormData');
    
    if (!formDataJson) return;
    
    try {
        const formData = JSON.parse(formDataJson);
        
        // Fill form fields
        if (document.getElementById('customer-name')) document.getElementById('customer-name').value = formData.customerName || '';
        if (document.getElementById('phone-number')) document.getElementById('phone-number').value = formData.phoneNumber || '';
        if (document.getElementById('email')) document.getElementById('email').value = formData.email || '';
        if (document.getElementById('license')) document.getElementById('license').value = formData.license || '';
        if (document.getElementById('start-date')) {
            document.getElementById('start-date').value = formData.startDate || '';
            calculateEndDate();
            updateEndDateConstraints();
        }
        if (document.getElementById('rental-period')) {
            document.getElementById('rental-period').value = formData.rentalPeriod || '';
            updateTotalPrice();
            calculateEndDate();
        }
        if (document.getElementById('end-date')) document.getElementById('end-date').value = formData.endDate || '';
        
        // Validate form
        checkFormValidity();
    } catch (e) {
        console.error('Error loading form data from localStorage:', e);
    }
}

/**
 * Clear form data in localStorage
 */
function clearFormData() {
    localStorage.removeItem('reservationFormData');
}

/**
 * Submit reservation
 */
function submitReservation() {
    const form = document.getElementById('reservation-form');
    const submitButton = document.getElementById('submit-btn');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Disable submit button, show loading indicator
    if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('disabled');
    }
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // Collect
    const formData = {
        vin: document.getElementById('car-vin').value,
        customer_name: document.getElementById('customer-name').value,
        phone: document.getElementById('phone-number').value,
        email: document.getElementById('email').value,
        license: document.getElementById('license').value,
        start_date: document.getElementById('start-date').value,
        rental_period_days: document.getElementById('rental-period').value
    };
    
    // Send AJAX request
    fetch('api/submit_order.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => {
        return response.json();
    })
    .then(data => {
        if (data.status === 'success') {
            // Order submitted successfully
            displayOrderConfirmation(data.data);
            // Clear form data
            clearFormData();
        } else {
            // Show error message
            showNotification(data.message, 'error');
            // Re-enable submit button
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.classList.remove('disabled');
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Error submitting order', 'error');
        // Re-enable submit button
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('disabled');
        }
    })
    .finally(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    });
}

/**
 * Display order confirmation
 * @param {Object} orderData - Order data
 */
function displayOrderConfirmation(orderData) {
    const formContainer = document.getElementById('reservation-form-container');
    const confirmationContainer = document.createElement('div');
    confirmationContainer.className = 'order-confirmation';

    confirmationContainer.innerHTML = `
        <h3>Order Submitted Successfully</h3>
        <div class="confirmation-message">
            <p>Your order has been successfully submitted, but not yet finally confirmed.</p>
            <p>To ensure your reservation is effective, please click the confirmation link below to complete the booking process.</p>
        </div>
        <div class="order-details">
            <p>Order Number: <strong>${orderData.order_id}</strong></p>
            <p>Total Price: <strong>$${orderData.total_price.toFixed(2)}</strong></p>
        </div>
        <div class="confirmation-instruction">
            <p><strong>Important Notice:</strong> You must click the confirmation button below, otherwise the order will not be processed!</p>
        </div>
        <button class="confirm-button" data-order-id="${orderData.order_id}">
            <span class="confirm-icon">✓</span> Click to Confirm Order
        </button>
        <div class="confirmation-note">
            <p>After confirmation, we will send detailed information to your email. Please keep your order number safe.</p>
        </div>
    `;
    
    // Replace
    formContainer.innerHTML = '';
    formContainer.appendChild(confirmationContainer);

    const confirmButton = confirmationContainer.querySelector('.confirm-button');

    confirmButton.addEventListener('click', function(e) {
        e.preventDefault();
        this.classList.add('loading');
        this.innerHTML = '<span class="loading-dots">Processing...</span>';
        this.disabled = true;
        
        const orderId = this.getAttribute('data-order-id');
        confirmOrder(orderId);
    });
    
    // Show confirmation container
    confirmationContainer.style.opacity = '0';
    confirmationContainer.style.display = 'block';
    setTimeout(() => {
        confirmationContainer.style.opacity = '1';
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Order Submitted", {
                body: "Please confirm your order to complete the booking process",
                icon: "/img/logo.svg"
            });
        }
    }, 10);
}

/**
 * Confirm order
 * @param {string} orderId - Order ID
 */
function confirmOrder(orderId) {
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'flex';
    
    // restore confirm button state
    function restoreConfirmButton() {
        const confirmButton = document.querySelector('.confirm-button');
        if (confirmButton) {
            confirmButton.classList.remove('loading');
            confirmButton.innerHTML = '<span class="confirm-icon">✓</span> Click to Confirm Order';
            confirmButton.disabled = false;
        }
    }
    
    fetch('api/confirm_order.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ order_id: orderId })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            showNotification('Order confirmed successfully!', 'success');

            const confirmationContainer = document.querySelector('.order-confirmation');
            if (confirmationContainer) {
                confirmationContainer.innerHTML = `
                    <div class="success-icon">✓</div>
                    <h3>Order Successfully Confirmed</h3>
                    <div class="confirmation-success-message">
                        <p>Your order has been confirmed and processed, thank you for your booking!</p>
                    </div>
                    <div class="order-details">
                        <p>Order Number: <strong>${orderId}</strong></p>
                        <p>Status: <span class="status-confirmed">Confirmed</span></p>
                    </div>
                    <div class="next-steps">
                        <p>We have sent a confirmation email to your mailbox with pickup details and contact information.</p>
                        <p>Please present your order number and valid ID when picking up the car.</p>
                    </div>
                    <a href="index.php" class="back-button">Return to Homepage</a>
                `;
            }

            if ("Notification" in window && Notification.permission === "granted") {
                new Notification("Order Confirmed", {
                    body: "Your car rental order has been successfully confirmed",
                    icon: "/img/logo.svg"
                });
            }
        } else {
            // Show more friendly error message
            showNotification(data.message || 'Error occurred while confirming order', 'error');
            restoreConfirmButton();
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('Network error occurred while confirming order, please try again', 'error');
        restoreConfirmButton();
    })
    .finally(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    });
}

/**
 * Show notification message
 * @param {string} message - Message content
 * @param {string} type - Message type (success, error, info)
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    notification.style.display = 'block';

    // Auto disappear after 3s
    setTimeout(() => {
        notification.style.display = 'none';
        notification.remove();
    }, 3000);
}

/**
 * Calculate end date based on start date and rental period
 */
function calculateEndDate() {
    const startDateInput = document.getElementById('start-date');
    const periodInput = document.getElementById('rental-period');
    const endDateInput = document.getElementById('end-date');
    
    if (!startDateInput || !periodInput || !endDateInput) return;
    
    const startDate = startDateInput.value;
    const period = parseInt(periodInput.value);
    
    if (startDate && period > 0) {
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(start.getDate() + period);
        
        // Format to YYYY-MM-DD
        const endDateStr = end.toISOString().split('T')[0];
        endDateInput.value = endDateStr;
        
        // Update end date constraints
        updateEndDateConstraints();
    }
}

/**
 * Calculate rental period based on start date and end date
 */
function calculateRentalPeriod() {
    const startDateInput = document.getElementById('start-date');
    const periodInput = document.getElementById('rental-period');
    const endDateInput = document.getElementById('end-date');
    
    if (!startDateInput || !periodInput || !endDateInput) return;
    
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        // Calculate difference in days
        const diffTime = end.getTime() - start.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 0) {
            periodInput.value = diffDays;
            // Trigger events to update price
            periodInput.dispatchEvent(new Event('input'));
            // Clear any previous errors
            endDateInput.classList.remove('error');
            const errorMsg = endDateInput.nextElementSibling;
            if (errorMsg) errorMsg.style.display = 'none';
        } else {
            endDateInput.classList.add('error');
            const errorMsg = endDateInput.nextElementSibling;
            if (errorMsg) {
                errorMsg.textContent = 'Return date must be after start date';
                errorMsg.style.display = 'block';
            }
            showNotification('Return date cannot be earlier than or same as start date', 'error');
            // Clear the invalid end date after a short delay
            setTimeout(() => {
                endDateInput.value = '';
                endDateInput.classList.remove('error');
                if (errorMsg) errorMsg.style.display = 'none';
            }, 2000);
        }
    }
}

/**
 * Update end date constraints based on start date
 */
function updateEndDateConstraints() {
    const endDateInput = document.getElementById('end-date');
    const startDateInput = document.getElementById('start-date');
    
    if (!endDateInput || !startDateInput) return;
    
    const startDate = startDateInput.value;
    
    if (startDate) {
        const start = new Date(startDate);
        const nextDay = new Date(start);
        nextDay.setDate(start.getDate() + 1);
        
        // Set minimum date for end date to be the day after start date
        endDateInput.min = nextDay.toISOString().split('T')[0];
    }
} 
