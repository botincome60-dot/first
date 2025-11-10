// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// User data management
function initializeUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
        const telegramUser = tg?.initDataUnsafe?.user;
        const newUser = {
            id: telegramUser?.id || Math.floor(100000 + Math.random() * 900000),
            first_name: telegramUser?.first_name || 'ইউজার',
            username: telegramUser?.username || '',
            balance: 4170.00,
            today_ads: 0,
            total_ads: 11,
            total_referrals: 35,
            total_income: 330.00,
            join_date: new Date().toISOString()
        };
        localStorage.setItem('telegramUserData', JSON.stringify(newUser));
    }
}

function getUserData() {
    let userData = localStorage.getItem('telegramUserData');
    if (!userData) {
        initializeUserData();
        userData = localStorage.getItem('telegramUserData');
    }
    return JSON.parse(userData);
}

function updateUserData(updates) {
    const userData = getUserData();
    const updatedData = { ...userData, ...updates };
    localStorage.setItem('telegramUserData', JSON.stringify(updatedData));
    return updatedData;
}

function generateReferralLink() {
    const user = getUserData();
    return `https://t.me/sohojincomebot?start=ref${user.id}`;
}

async function copyReferralLink() {
    const refLink = generateReferralLink();
    const user = getUserData();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Firebase থেকে real count নেওয়ার চেষ্টা করুন
        let realCount = user.total_referrals;
        if (typeof getReferralCount !== 'undefined') {
            realCount = await getReferralCount(user.id);
        }
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${realCount} জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${realCount} জন`);
        }
    } catch (error) {
        alert('লিঙ্ক কপি করতে সমস্যা হয়েছে!');
    }
}

// Initialize app
function initApp() {
    if (tg) {
        tg.expand();
        tg.ready();
    }
    
    const user = getUserData();
    
    // Update user info immediately
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = user.first_name;
    }
    if (document.getElementById('mainBalance')) {
        document.getElementById('mainBalance').textContent = user.balance.toFixed(2) + ' টাকা';
    }
    if (document.getElementById('todayAds')) {
        document.getElementById('todayAds').textContent = user.today_ads + '/10';
    }
    if (document.getElementById('totalReferrals')) {
        document.getElementById('totalReferrals').textContent = user.total_referrals;
    }
    if (document.getElementById('totalReferrals2')) {
        document.getElementById('totalReferrals2').textContent = user.total_referrals;
    }
    if (document.getElementById('totalAds')) {
        document.getElementById('totalAds').textContent = user.total_ads;
    }
    if (document.getElementById('totalIncome')) {
        document.getElementById('totalIncome').textContent = user.total_income.toFixed(2) + ' টাকা';
    }
    
    // Set referral link immediately
    if (document.getElementById('referralLink')) {
        document.getElementById('referralLink').textContent = generateReferralLink();
    }
}

// Withdraw check function
function checkWithdraw() {
    const user = getUserData();
    if (user.total_referrals < 15) {
        alert(`🚫 Withdraw অযোগ্য!\n\nআপনার ${15 - user.total_referrals}টি আরও রেফারেল দরকার!\n\nআপনার রেফারেল: ${user.total_referrals} জন\nপ্রয়োজন: ১৫ জন`);
        return false;
    }
    return true;
}

// Complete ad watch
function completeAdWatch() {
    const user = getUserData();
    const newBalance = user.balance + 30;
    const newTotalIncome = user.total_income + 30;
    const newTotalAds = user.total_ads + 1;
    const newTodayAds = user.today_ads + 1;
    
    updateUserData({ 
        balance: newBalance,
        total_income: newTotalIncome,
        total_ads: newTotalAds,
        today_ads: newTodayAds
    });
    
    alert('🎉 এড দেখা সম্পন্ন! ৩০ টাকা আপনার একাউন্টে যোগ করা হয়েছে।');
    return true;
}

// Initialize when ready
document.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // Navigation active state
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

// Export functions
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.generateReferralLink = generateReferralLink;
window.copyReferralLink = copyReferralLink;
window.checkWithdraw = checkWithdraw;
window.completeAdWatch = completeAdWatch;