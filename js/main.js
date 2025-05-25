document.addEventListener('DOMContentLoaded', function() {
    // Initial loading of all cars
    loadCars();

    // Search box handling
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    const suggestionsContainer = document.getElementById('suggestions-container');
    
    // Search functionality
    searchButton.addEventListener('click', function() {
        const keyword = searchInput.value.trim();
        loadCars(keyword, getSelectedTypes(), getSelectedBrands());
    });
    
    // Enter key search
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchButton.click();
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Real-time search suggestions
    let debounceTimeout;
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();

        clearTimeout(debounceTimeout);
        
        if (query.length > 0) { // A suggestion will be displayed after entering one character
            debounceTimeout = setTimeout(() => {
                fetchSearchSuggestions(query);
            }, 300);
        } else {
            suggestionsContainer.style.display = 'none';
        }
    });
    
    // Click outside to close suggestions
    document.addEventListener('click', function(e) {
        if (e.target !== searchInput && e.target !== suggestionsContainer && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    });

    const filterButton = document.getElementById('filter-button');
    if (filterButton) {
        filterButton.addEventListener('click', function() {
            const keyword = searchInput.value.trim();
            loadCars(keyword, getSelectedTypes(), getSelectedBrands());
        });
    }

    const clearFilterButton = document.getElementById('clear-filter-button');
    if (clearFilterButton) {
        clearFilterButton.addEventListener('click', function() {
            clearAllFilters();
            // Reload cars with cleared filters
            const keyword = searchInput.value.trim();
            loadCars(keyword, [], []);
        });
    }

    setupFilterCheckboxes();
});

/**
 * Load cars list
 * @param {string} keyword - Search keyword
 * @param {Array} types - Selected car types
 * @param {Array} brands - Selected car brands
 */
function loadCars(keyword = '', types = [], brands = []) {
    const carsGrid = document.getElementById('cars-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    
    if (!carsGrid) return;
    
    // Show loading indicator
    carsGrid.innerHTML = '';
    loadingIndicator.style.display = 'flex';
    
    // Build query parameters
    let queryParams = [];
    if (keyword) queryParams.push(`keyword=${encodeURIComponent(keyword)}`);
    
    // Add multiple types if selected
    if (types && types.length > 0) {
        types.forEach(type => {
            queryParams.push(`type[]=${encodeURIComponent(type)}`);
        });
    }
    
    // Add multiple brands if selected
    if (brands && brands.length > 0) {
        brands.forEach(brand => {
            queryParams.push(`brand[]=${encodeURIComponent(brand)}`);
        });
    }
    
    const queryString = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
    
    // Send AJAX request
    fetch(`api/search_cars.php${queryString}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response not OK');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                displayCars(data.data);
            } else {
                displayError('Failed to load car data');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            displayError('Request failed: ' + error.message);
        })
        .finally(() => {
            loadingIndicator.style.display = 'none';
        });
}

/**
 * Display cars list
 * @param {Array} cars - Car data array
 */
function displayCars(cars) {
    const carsGrid = document.getElementById('cars-grid');
    
    if (cars.length === 0) {
        carsGrid.innerHTML = '<div class="no-results">No cars found matching your criteria</div>';
        return;
    }
    
    carsGrid.innerHTML = '';
    
    cars.forEach(car => {
        const carCard = document.createElement('div');
        carCard.className = 'car-card';
        
        // Only include essential information in a concise version
        carCard.innerHTML = `
            <div class="car-image-container">
                <img src="${car.image_url}" alt="${car.brand} ${car.model}" class="car-image">
                <div class="availability-tag ${!car.availability ? 'unavailable-tag' : ''}">
                    ${car.availability ? 'Available' : 'Car Unavailable'}
                </div>
            </div>
            <div class="car-details">
                <h3 class="car-name">${car.brand} ${car.model}</h3>
                <p class="car-description">${car.description}</p>
                <div class="car-info">
                    <div class="car-info-item">Type: <span>${car.type}</span></div>
                    <div class="car-info-item">Year: <span>${car.year}</span></div>
                    <div class="car-info-item">Mileage: <span>${car.mileage} miles</span></div>
                    <div class="car-info-item">Fuel: <span>${car.fuel_type}</span></div>
                </div>
                <div class="car-price">$${car.price_per_day}/day</div>
                <button class="rent-button ${!car.availability ? 'disabled' : ''}" 
                        data-vin="${car.vin}" 
                        ${!car.availability ? 'disabled' : ''}>
                    ${car.availability ? 'Rent Now' : 'Unavailable'}
                </button>
            </div>
        `;
        
        carsGrid.appendChild(carCard);
        
        // Add click event only for available cars
        if (car.availability) {
            const rentButton = carCard.querySelector('.rent-button');
            rentButton.addEventListener('click', function() {
                const vin = this.getAttribute('data-vin');
                // Save to sessionStorage
                sessionStorage.setItem('selected_vin', vin);
                // Navigate to reservation page
                window.location.href = 'reservation.php';
            });
        }
    });
}

/**
 * Display error message
 * @param {string} message - Error message
 */
function displayError(message) {
    const carsGrid = document.getElementById('cars-grid');
    carsGrid.innerHTML = `<div class="error-message">${message}</div>`;
}

/**
 * Get search suggestions
 * @param {string} query - Search query
 */
function fetchSearchSuggestions(query) {
    // 显示加载指示器或提示(可选)
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '<div class="suggestion-loading">Loading suggestions...</div>';
    suggestionsContainer.style.display = 'block';
    
    fetch(`api/get_suggestions.php?query=${encodeURIComponent(query)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response not OK');
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                displaySuggestions(data.data, query);
            } else {
                // 如果API返回错误，隐藏建议容器
                suggestionsContainer.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Error:', error);
            // 出错时隐藏建议容器
            suggestionsContainer.style.display = 'none';
        });
}

/**
 * Display search suggestions
 * @param {Array} suggestions - Suggestion array
 * @param {string} query - Original query
 */
function displaySuggestions(suggestions, query) {
    const suggestionsContainer = document.getElementById('suggestions-container');
    suggestionsContainer.innerHTML = '';
    
    if (suggestions.length === 0) {
        // 没有建议时显示提示信息
        suggestionsContainer.innerHTML = '<div class="no-suggestions">No matching suggestions</div>';
        setTimeout(() => {
            suggestionsContainer.style.display = 'none';
        }, 2000); // 2秒后隐藏
        return;
    }
    
    // 限制显示数量，最多显示8个建议
    const limitedSuggestions = suggestions.slice(0, 8);
    
    // 创建建议项
    limitedSuggestions.forEach(suggestion => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        
        // 检查是否是类型建议
        const isType = suggestion.includes(' (Type)');
        const displayText = isType ? suggestion.replace(' (Type)', '') : suggestion;
        const searchText = displayText; // 用于搜索的文本（不包含Type标识）
        
        // 高亮匹配的部分
        const lowerSuggestion = displayText.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const index = lowerSuggestion.indexOf(lowerQuery);
        
        if (index !== -1) {
            // 将匹配部分加粗显示
            const beforeMatch = displayText.substring(0, index);
            const match = displayText.substring(index, index + query.length);
            const afterMatch = displayText.substring(index + query.length);
            
            if (isType) {
                item.innerHTML = `${beforeMatch}<strong>${match}</strong>${afterMatch} <span style="color: #66b3ff; font-size: 0.9em;">(Type)</span>`;
            } else {
                item.innerHTML = `${beforeMatch}<strong>${match}</strong>${afterMatch}`;
            }
        } else {
            if (isType) {
                item.innerHTML = `${displayText} <span style="color: #66b3ff; font-size: 0.9em;">(Type)</span>`;
            } else {
                item.textContent = displayText;
            }
        }
        
        // 点击建议项执行搜索
        item.addEventListener('click', function() {
            document.getElementById('search-input').value = searchText;
            suggestionsContainer.style.display = 'none';
            
            // 执行搜索
            loadCars(searchText, getSelectedTypes(), getSelectedBrands());
        });
        
        suggestionsContainer.appendChild(item);
    });
    
    suggestionsContainer.style.display = 'block';
}

/**
 * Get selected car types (multiple)
 * @returns {Array} Array of selected types
 */
function getSelectedTypes() {
    const typeCheckboxes = document.querySelectorAll('input[name="car-type"]');
    const selectedTypes = [];
    
    typeCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedTypes.push(checkbox.value);
        }
    });
    
    return selectedTypes;
}

/**
 * Get selected car brands (multiple)
 * @returns {Array} Array of selected brands
 */
function getSelectedBrands() {
    const brandCheckboxes = document.querySelectorAll('input[name="car-brand"]');
    const selectedBrands = [];
    
    brandCheckboxes.forEach(checkbox => {
        if (checkbox.checked) {
            selectedBrands.push(checkbox.value);
        }
    });
    
    return selectedBrands;
}

/**
 * Clear all filter selections
 */
function clearAllFilters() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    filterCheckboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
}

/**
 * Setup filter checkboxes to make them easier to toggle
 */
function setupFilterCheckboxes() {
    const filterCheckboxes = document.querySelectorAll('.filter-checkbox');
    
    filterCheckboxes.forEach(checkbox => {
        // Add click event to the label for easier toggling
        const label = checkbox.nextElementSibling;
        if (label) {
            label.addEventListener('click', function(e) {
                e.preventDefault(); // Prevent default label behavior
                checkbox.checked = !checkbox.checked; // Toggle checkbox state
            });
        }
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
    
    // Automatically disappear after 3 seconds
    setTimeout(() => {
        notification.style.display = 'none';
        notification.remove();
    }, 3000);
} 
