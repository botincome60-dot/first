// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// Initialize the app
function initTelegramApp() {
    if (tg) {
        tg.expand();
        tg.ready();
        
        console.log('Telegram Web App initialized');
        console.log('User data:', tg.initDataUnsafe?.user);
        
        // Initialize user data if not exists
        initializeUserData();
    } else {
        console.log('Telegram Web App not detected, running in standalone mode');
        initializeUserData();
    }
}

// User data management - IMPROVED
function initializeUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
        // Create new user data from Telegram
        const telegramUser = tg?.initDataUnsafe?.user;
        const newUser = {
            id: telegramUser?.id || Math.floor(100000 + Math.random() * 900000),
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
    }
}

// Get user data - IMPROVED
function getUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
        // If no data in localStorage, get from Telegram
        const telegramUser = tg?.initDataUnsafe?.user;
        if (telegramUser) {
            userData = {
                id: telegramUser.id,
                first_name: telegramUser.first_name || 'ইউজার',
                username: telegramUser.username || '',
                balance: 0.00,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 0.00,
                join_date: new Date().toISOString()
            };
            localStorage.setItem('telegramUserData', JSON.stringify(userData));
        } else {
            // Fallback data
            userData = {
                id: Math.floor(100000 + Math.random() * 900000),
                first_name: 'ইউজার',
                username: '',
                balance: 0.00,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 0.00,
                join_date: new Date().toISOString()
            };
        }
    }
    
    return typeof userData === 'string' ? JSON.parse(userData) : userData;
}

// Update user data
function updateUserData(updates) {
    const userData = getUserData();
    const updatedData = { ...userData, ...updates };
    localStorage.setItem('telegramUserData', JSON.stringify(updatedData));
    return updatedData;
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

// Generate referral link - CORRECTED
function generateReferralLink() {
    const user = getUserData();
    const botUsername = 'sohojincomebot'; // আপনার সঠিক username
    return `https://t.me/${botUsername}?start=ref${user.id}`;
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
    
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
window.generateReferralLink = generateReferralLink;