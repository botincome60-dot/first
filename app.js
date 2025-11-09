// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// Initialize the app
function initTelegramApp() {
    if (tg) {
        tg.expand();
        tg.ready();
        
        // Set theme params
        const theme = tg.themeParams;
        if (theme.bg_color) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', theme.bg_color);
        }
        
        console.log('Telegram Web App initialized');
        
        // Initialize user data if not exists
        initializeUserData();
    } else {
        console.log('Telegram Web App not detected, running in standalone mode');
        initializeUserData();
    }
}

// User data management
function initializeUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
        // Create new user data
        const telegramUser = tg?.initDataUnsafe?.user;
        const newUser = {
            id: telegramUser?.id || Date.now(),
            first_name: telegramUser?.first_name || 'ইউজার',
            username: telegramUser?.username || '',
            balance: 0.00,
            today_ads: 0,
            total_ads: 0,
            total_referrals: 0,
            total_income: 0.00,
            join_date: new Date().toISOString()
        };
        
        localStorage.setItem('telegramUserData', JSON.stringify(newUser));
        console.log('New user data created:', newUser);
    } else {
        console.log('Existing user data loaded:', JSON.parse(userData));
    }
}

// Get user data
function getUserData() {
    const userData = localStorage.getItem('telegramUserData');
    return userData ? JSON.parse(userData) : null;
}

// Update user data
function updateUserData(updates) {
    const userData = getUserData();
    const updatedData = { ...userData, ...updates };
    localStorage.setItem('telegramUserData', JSON.stringify(updatedData));
    return updatedData;
}

// Reset daily ads (this would typically be called by a backend)
function resetDailyAds() {
    const userData = getUserData();
    if (userData) {
        // Check if we need to reset (after 24 hours)
        const lastReset = localStorage.getItem('lastAdsReset');
        const now = Date.now();
        
        if (!lastReset || (now - parseInt(lastReset)) > 24 * 60 * 60 * 1000) {
            updateUserData({ today_ads: 0 });
            localStorage.setItem('lastAdsReset', now.toString());
            console.log('Daily ads reset');
        }
    }
}

// Format currency
function formatCurrency(amount) {
    return amount.toFixed(2) + ' টাকা';
}

// Show notification
function showNotification(message, type = 'info') {
    if (tg && tg.showPopup) {
        tg.showPopup({
            title: type === 'success' ? 'সফল!' : 
                   type === 'error' ? 'ত্রুটি!' : 'মেসেজ',
            message: message,
            buttons: [{ type: 'close' }]
        });
    } else {
        alert(message);
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
    resetDailyAds(); // Check if daily ads need reset
    
    // Update active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.bottom-nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('text-blue-600');
            link.classList.remove('text-gray-500');
        }
    });
});

// Handle back button
if (tg && tg.BackButton) {
    tg.BackButton.show();
    tg.BackButton.onClick(function() {
        window.history.back();
    });
}

// Export functions for global access
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.showNotification = showNotification;
window.formatCurrency = formatCurrency;