// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
  authDomain: "sohojincome-36f1f.firebaseapp.com",
  projectId: "sohojincome-36f1f",
  storageBucket: "sohojincome-36f1f.firebasestorage.app",
  messagingSenderId: "398153090805",
  appId: "1:398153090805:web:fc8d68130afbc2239be7bc",
  measurementId: "G-VZ47961SJV"
};

// Initialize Firebase
let db = null;
try {
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        console.log('✅ Firebase initialized');
    }
} catch (error) {
    console.log('Firebase init error:', error);
}

// User data management
function initializeUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
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
    }
}

function getUserData() {
    let userData = localStorage.getItem('telegramUserData');
    if (!userData) {
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
        } else {
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
        localStorage.setItem('telegramUserData', JSON.stringify(userData));
    }
    return JSON.parse(userData);
}

function updateUserData(updates) {
    const userData = getUserData();
    const updatedData = { ...userData, ...updates };
    localStorage.setItem('telegramUserData', JSON.stringify(updatedData));
    return updatedData;
}

// Firebase functions with SIMPLE fallback
async function getReferralCount(userId) {
    try {
        if (!db) {
            console.log('Firebase not available, using fallback');
            const user = getUserData();
            return user.total_referrals || 0;
        }
        
        const doc = await db.collection('referrals').doc(userId.toString()).get();
        if (doc.exists) {
            const count = doc.data().count || 0;
            // Update local storage
            updateUserData({ total_referrals: count });
            return count;
        }
        return 0;
    } catch (error) {
        console.log('Firebase error, using fallback:', error);
        const user = getUserData();
        return user.total_referrals || 0;
    }
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
        const refCount = await getReferralCount(user.id);
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${refCount} জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${refCount} জন`);
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
    initializeUserData();
    
    const user = getUserData();
    
    // Update user info immediately
    document.getElementById('userName').textContent = user.first_name;
    document.getElementById('mainBalance').textContent = user.balance.toFixed(2) + ' টাকা';
    document.getElementById('todayAds').textContent = user.today_ads + '/10';
    document.getElementById('totalAds').textContent = user.total_ads;
    document.getElementById('totalIncome').textContent = user.total_income.toFixed(2) + ' টাকা';
    
    // Set referral link immediately
    document.getElementById('referralLink').textContent = generateReferralLink();
    
    // Load referral count
    setTimeout(() => {
        updateReferralDisplay();
    }, 1000);
}

async function updateReferralDisplay() {
    const user = getUserData();
    const count = await getReferralCount(user.id);
    
    // Update all referral elements
    const elements = document.querySelectorAll('[id*="Referral"], [id*="referral"]');
    elements.forEach(element => {
        element.textContent = count;
    });
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
window.getReferralCount = getReferralCount;