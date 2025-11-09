// Telegram Web App functionality
const tg = window.Telegram.WebApp;
let userData = null;

// Initialize the app
function initApp() {
    console.log('Initializing Sohoj Income App...');
    
    // Expand Telegram Web App to full screen
    tg.expand();
    tg.ready();
    
    // Get user data from Telegram
    userData = tg.initDataUnsafe?.user;
    
    if (userData) {
        displayUserInfo();
        generateReferralCode();
        loadUserPoints();
    } else {
        showError('User data not available');
    }
    
    console.log('Telegram Web App initialized successfully');
}

// Display user information
function displayUserInfo() {
    const userInfoDiv = document.getElementById('userInfo');
    
    if (userData) {
        userInfoDiv.innerHTML = `
            <div class="flex items-center justify-center space-x-3">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                    <span class="text-white font-bold text-lg">
                        ${userData.first_name ? userData.first_name[0].toUpperCase() : 'U'}
                    </span>
                </div>
                <div class="text-left">
                    <h3 class="text-white font-semibold">${userData.first_name || 'User'}</h3>
                    <p class="text-white/70 text-sm">ID: ${userData.id}</p>
                </div>
            </div>
        `;
    }
}

// Generate referral code based on user ID
function generateReferralCode() {
    if (userData) {
        const baseCode = userData.id.toString();
        const refCode = 'SOJ' + baseCode.slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
        document.getElementById('refCode').textContent = refCode;
        
        // Save to local storage
        localStorage.setItem('userRefCode', refCode);
    }
}

// Copy referral link to clipboard
async function copyReferral() {
    try {
        const refCode = document.getElementById('refCode').textContent;
        const refLink = `https://t.me/sohojincomebot?start=${refCode}`;
        
        await navigator.clipboard.writeText(refLink);
        
        // Show success message in Telegram
        tg.showPopup({
            title: "✅ Copied!",
            message: "Referral link copied to clipboard!\nShare with friends to earn bonus points.",
            buttons: [{ type: "close" }]
        });
        
        // Optional: Add haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('soft');
        }
        
    } catch (error) {
        console.error('Failed to copy:', error);
        showError('Failed to copy referral link');
    }
}

// Complete task and add points
function completeTask(taskType) {
    let pointsToAdd = 0;
    let taskName = '';
    
    switch(taskType) {
        case 'join_channel':
            pointsToAdd = 50;
            taskName = 'Join Telegram Channel';
            break;
        case 'watch_video':
            pointsToAdd = 30;
            taskName = 'Watch Video';
            break;
        case 'share_post':
            pointsToAdd = 25;
            taskName = 'Share Post';
            break;
        default:
            pointsToAdd = 0;
    }
    
    if (pointsToAdd > 0) {
        // Get current points from localStorage
        const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
        const newPoints = currentPoints + pointsToAdd;
        
        // Save to localStorage
        localStorage.setItem('userPoints', newPoints.toString());
        
        // Update UI
        document.getElementById('pointsBalance').textContent = newPoints;
        
        // Show success popup
        tg.showPopup({
            title: "🎉 Task Completed!",
            message: `You earned ${pointsToAdd} points for ${taskName}!\n\nTotal Points: ${newPoints}`,
            buttons: [{ type: "close" }]
        });
        
        // Haptic feedback
        if (tg.HapticFeedback) {
            tg.HapticFeedback.impactOccurred('medium');
        }
        
        console.log(`Task completed: ${taskName}, Points added: ${pointsToAdd}`);
    }
}

// Load user points from localStorage
function loadUserPoints() {
    const points = localStorage.getItem('userPoints') || '0';
    document.getElementById('pointsBalance').textContent = points;
}

// Show withdraw options
function showWithdraw() {
    const currentPoints = parseInt(localStorage.getItem('userPoints') || '0');
    const minWithdrawal = 500;
    
    if (currentPoints < minWithdrawal) {
        tg.showPopup({
            title: "⚠️ Not Enough Points",
            message: `You need ${minWithdrawal - currentPoints} more points to withdraw.\n\nCurrent: ${currentPoints} points\nRequired: ${minWithdrawal} points`,
            buttons: [{ type: "close" }]
        });
    } else {
        tg.showPopup({
            title: "💰 Withdraw Money",
            message: `Available: ${currentPoints} points\n\nPayment Methods:\n• bKash\n• Nagad\n• Rocket\n\nContact admin for withdrawal.`,
            buttons: [{ type: "close" }]
        });
    }
}

// Show error message
function showError(message) {
    tg.showPopup({
        title: "❌ Error",
        message: message,
        buttons: [{ type: "close" }]
    });
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

// Handle Telegram events
tg.onEvent('viewportChanged', function() {
    console.log('Viewport changed');
});

// Back button handler
tg.BackButton.onClick(function() {
    tg.close();
});