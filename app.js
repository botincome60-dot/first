// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// User data
let userData = {
    id: tg?.initDataUnsafe?.user?.id || 7070041932,
    first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
    balance: 0.00,
    today_ads: 0,
    total_ads: 0,
    total_referrals: 0,
    total_income: 0.00
};

// Initialize user data
function initializeUserData() {
    const savedData = localStorage.getItem('userData');
    if (!savedData) {
        localStorage.setItem('userData', JSON.stringify(userData));
    } else {
        userData = JSON.parse(savedData);
    }
}

function getUserData() {
    return userData;
}

function updateUserData(updates) {
    Object.assign(userData, updates);
    localStorage.setItem('userData', JSON.stringify(userData));
    return userData;
}

// Generate referral link
function generateReferralLink() {
    const user = getUserData();
    return `https://t.me/sohojincomebot?start=ref${user.id}`;
}

// Load referral count from Firebase
async function loadReferralCount() {
    try {
        if (typeof getReferralCount !== 'undefined') {
            const count = await getReferralCount(userData.id);
            if (count > 0) {
                updateUserData({ total_referrals: count });
                updateUI();
            }
        }
    } catch (error) {
        console.log('Failed to load referral count:', error);
    }
}

// Copy referral link
async function copyReferralLink() {
    const refLink = generateReferralLink();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Load fresh count
        await loadReferralCount();
        const user = getUserData();
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${user.total_referrals} জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${user.total_referrals} জন`);
        }
    } catch (error) {
        alert('লিঙ্ক কপি করতে সমস্যা হয়েছে!');
    }
}

// Update UI
function updateUI() {
    const user = getUserData();
    
    document.getElementById('userName').textContent = user.first_name;
    document.getElementById('mainBalance').textContent = user.balance.toFixed(2) + ' টাকা';
    document.getElementById('todayAds').textContent = user.today_ads + '/10';
    document.getElementById('totalReferrals').textContent = user.total_referrals;
    document.getElementById('totalReferrals2').textContent = user.total_referrals;
    document.getElementById('totalAds').textContent = user.total_ads;
    document.getElementById('totalIncome').textContent = user.total_income.toFixed(2) + ' টাকা';
    document.getElementById('referralLink').textContent = generateReferralLink();
}

// Initialize app
function initApp() {
    if (tg) {
        tg.expand();
        tg.ready();
    }
    
    initializeUserData();
    updateUI();
    
    // Load referral count from Firebase
    setTimeout(() => {
        loadReferralCount();
    }, 2000);
}

// Complete ad watch
function completeAdWatch() {
    const user = getUserData();
    updateUserData({ 
        balance: user.balance + 30,
        total_income: user.total_income + 30,
        total_ads: user.total_ads + 1,
        today_ads: user.today_ads + 1
    });
    
    alert('🎉 এড দেখা সম্পন্ন! ৩০ টাকা যোগ হয়েছে।');
    updateUI();
}

// Withdraw check
function checkWithdraw() {
    const user = getUserData();
    if (user.total_referrals < 15) {
        alert(`🚫 Withdraw অযোগ্য!\n\nআপনার ${15 - user.total_referrals}টি আরও রেফারেল দরকার!\n\nআপনার রেফারেল: ${user.total_referrals} জন\nপ্রয়োজন: ১৫ জন`);
        return false;
    }
    return true;
}

// Manual test function
function testReferral() {
    if (confirm('টেস্ট রেফারেল যোগ করবেন?')) {
        const user = getUserData();
        updateUserData({
            total_referrals: user.total_referrals + 1,
            balance: user.balance + 100
        });
        updateUI();
        alert('✅ টেস্ট রেফারেল যোগ করা হয়েছে! ১০০ টাকা বোনাস পেয়েছেন।');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initApp);

// Export functions
window.copyReferralLink = copyReferralLink;
window.completeAdWatch = completeAdWatch;
window.checkWithdraw = checkWithdraw;
window.testReferral = testReferral;