// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// User data - ALWAYS WORKING
let userData = {
    id: tg?.initDataUnsafe?.user?.id || Math.floor(100000 + Math.random() * 900000),
    first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
    balance: 4170.00,
    today_ads: 0,
    total_ads: 11,
    total_referrals: 35,
    total_income: 330.00
};

// Save to localStorage
localStorage.setItem('userData', JSON.stringify(userData));

// Get user data
function getUserData() {
    const data = localStorage.getItem('userData');
    return data ? JSON.parse(data) : userData;
}

// Update user data
function updateUserData(updates) {
    const currentData = getUserData();
    const updatedData = { ...currentData, ...updates };
    localStorage.setItem('userData', JSON.stringify(updatedData));
    return updatedData;
}

// Generate referral link
function generateReferralLink() {
    const user = getUserData();
    return `https://t.me/sohojincomebot?start=ref${user.id}`;
}

// Copy referral link
async function copyReferralLink() {
    const refLink = generateReferralLink();
    const user = getUserData();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Try to get Firebase count
        let displayCount = user.total_referrals;
        if (typeof getReferralCount !== 'undefined') {
            try {
                const firebaseCount = await getReferralCount(user.id);
                if (firebaseCount > 0) {
                    displayCount = firebaseCount;
                    updateUserData({ total_referrals: firebaseCount });
                }
            } catch (error) {
                console.log('Firebase not available, using local count');
            }
        }
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${displayCount} জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${displayCount} জন`);
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
    
    // Update UI immediately
    document.getElementById('userName').textContent = user.first_name;
    document.getElementById('mainBalance').textContent = user.balance.toFixed(2) + ' টাকা';
    document.getElementById('todayAds').textContent = user.today_ads + '/10';
    document.getElementById('totalReferrals').textContent = user.total_referrals;
    document.getElementById('totalReferrals2').textContent = user.total_referrals;
    document.getElementById('totalAds').textContent = user.total_ads;
    document.getElementById('totalIncome').textContent = user.total_income.toFixed(2) + ' টাকা';
    document.getElementById('referralLink').textContent = generateReferralLink();
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
    window.location.reload();
}

// Initialize
document.addEventListener('DOMContentLoaded', initApp);

// Export functions
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.generateReferralLink = generateReferralLink;
window.copyReferralLink = copyReferralLink;
window.checkWithdraw = checkWithdraw;
window.completeAdWatch = completeAdWatch;