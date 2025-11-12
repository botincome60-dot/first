
// app.js - Complete with Minimum Firebase Usage
console.log("🚀 App.js loading...");

const tg = window.Telegram?.WebApp;

// Firebase initialization
let db;
try {
    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
            authDomain: "sohojincome-36f1f.firebaseapp.com",
            projectId: "sohojincome-36f1f",
            storageBucket: "sohojincome-36f1f.firebasestorage.app",
            messagingSenderId: "398153090805",
            appId: "1:398153090805:web:fc8d68130afbc2239be7bc",
            measurementId: "G-VZ47961SJV"
        });
    }
    db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

// Global user data
let userData = null;
const LOCAL_STORAGE_KEY = 'sohojincome_userdata';

// Initialize user data
async function initializeUserData() {
    console.log("🔄 Initializing user data...");
    
    try {
        if (tg) {
            tg.expand();
            tg.ready();
        }

        let userId;
        if (tg?.initDataUnsafe?.user?.id) {
            userId = tg.initDataUnsafe.user.id.toString();
        } else {
            userId = 'test_' + Math.floor(1000000000 + Math.random() * 9000000000);
        }

        // ALWAYS use local storage for user data - NO FIREBASE READ
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            userData = JSON.parse(localData);
            if (userData.id === userId) {
                console.log("✅ User data loaded from localStorage");
            } else {
                userData = createNewUserData(userId);
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
            }
        } else {
            userData = createNewUserData(userId);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        }

        updateUI();
        hideLoading();

        setTimeout(() => loadReferralCount(), 1000);
        setTimeout(() => processReferralWithStartApp(), 2000);
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        fallbackUI();
        hideLoading();
    }
}

function createNewUserData(userId) {
    return {
        id: userId,
        first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
        balance: 50.00,
        today_ads: 0,
        total_ads: 0,
        today_bonus_ads: 0,
        total_referrals: 0,
        total_income: 50.00,
        join_date: new Date().toISOString(),
        referred_by: null,
        last_ad_reset: new Date().toISOString(),
        last_bonus_ad_reset: new Date().toISOString()
    };
}

async function loadReferralCount() {
    if (!userData || !db) return;
    
    try {
        const referralsRef = db.collection('referrals');
        const snapshot = await referralsRef.where('referredBy', '==', userData.id).get();
        
        const count = snapshot.size;
        userData.total_referrals = count;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        
        updateUI();
        
    } catch (error) {
        console.error("❌ Error loading referral count:", error);
    }
}

async function processReferralWithStartApp() {
    if (!userData || !db) return;
    
    try {
        if (userData.referred_by) return;
        
        let referralCode = null;
        
        if (tg?.initDataUnsafe?.start_param) {
            referralCode = tg.initDataUnsafe.start_param;
        } else {
            const urlParams = new URLSearchParams(window.location.search);
            referralCode = urlParams.get('startapp') || urlParams.get('start');
        }
        
        if (referralCode && referralCode.startsWith('ref')) {
            const referrerUserId = referralCode.replace('ref', '');
            
            if (referrerUserId !== userData.id) {
                await createReferralRecord(referrerUserId);
                giveBonusToCurrentUser();
                await giveBonusToReferrer(referrerUserId);
                
                showNotification(
                    '🎉 রেফারেল সফল!\n\nআপনি রেফারেল দ্বারা জয়েন করেছেন। ৫০ টাকা বোনাস পেয়েছেন!',
                    'success'
                );
            }
        }
    } catch (error) {
        console.error('❌ Error processing referral:', error);
    }
}

async function createReferralRecord(referrerUserId) {
    try {
        const referralData = {
            userId: userData.id,
            referredBy: referrerUserId,
            newUserName: userData.first_name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('referrals').doc(userData.id).set(referralData);
        
        userData.referred_by = referrerUserId;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        
    } catch (error) {
        console.error("❌ Error creating referral record:", error);
        throw error;
    }
}

function giveBonusToCurrentUser() {
    userData.balance += 50;
    userData.total_income += 50;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    updateUI();
}

async function giveBonusToReferrer(referrerUserId) {
    try {
        const referrerRef = db.collection('users').doc(referrerUserId);
        
        await referrerRef.update({
            balance: firebase.firestore.FieldValue.increment(100),
            total_income: firebase.firestore.FieldValue.increment(100),
            total_referrals: firebase.firestore.FieldValue.increment(1)
        });
        
    } catch (error) {
        console.error("❌ Error giving bonus to referrer:", error);
    }
}

async function updateUserData(updates) {
    if (!userData) return;
    
    Object.assign(userData, updates);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    updateUI();
    
    return userData;
}

function getUserData() {
    return userData;
}

function updateUI() {
    if (!userData) return;
    
    const elements = {
        'userName': userData.first_name,
        'profileName': userData.first_name,
        'mainBalance': userData.balance.toFixed(2) + ' টাকা',
        'withdrawBalance': userData.balance.toFixed(2) + ' টাকা',
        'todayAds': userData.today_ads + '/10',
        'adsCounter': userData.today_ads + '/10',
        'bonusAdsCount': (userData.today_bonus_ads || 0) + '/10',
        'totalReferrals': userData.total_referrals,
        'totalReferrals2': userData.total_referrals,
        'totalAds': userData.total_ads,
        'profileTotalAds': userData.total_ads,
        'totalIncome': userData.total_income.toFixed(2) + ' টাকা',
        'profileTotalIncome': userData.total_income.toFixed(2) + ' টাকা',
        'referralLink': `https://t.me/sohojincomebot?startapp=ref${userData.id}`,
        'supportReferralLink': `https://t.me/sohojincomebot?startapp=ref${userData.id}`,
        'profileUserId': userData.id,
        'profileReferrals': userData.total_referrals
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }
    
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = (userData.today_ads / 10) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    const bonusProgressBar = document.getElementById('bonusProgressBar');
    if (bonusProgressBar) {
        const bonusProgress = ((userData.today_bonus_ads || 0) / 10) * 100;
        bonusProgressBar.style.width = `${bonusProgress}%`;
    }
    
    const adsRemaining = document.getElementById('adsRemaining');
    if (adsRemaining) {
        const remaining = 10 - userData.today_ads;
        adsRemaining.textContent = remaining > 0 ? remaining : 0;
    }
}

function fallbackUI() {
    const elements = {
        'userName': 'ইউজার',
        'profileName': 'ইউজার',
        'mainBalance': '50.00 টাকা',
        'withdrawBalance': '50.00 টাকা',
        'todayAds': '0/10',
        'adsCounter': '0/10',
        'bonusAdsCount': '0/10',
        'totalReferrals': '0',
        'totalReferrals2': '0',
        'totalAds': '0',
        'profileTotalAds': '0',
        'totalIncome': '50.00 টাকা',
        'profileTotalIncome': '50.00 টাকা',
        'referralLink': 'লোড হচ্ছে...',
        'supportReferralLink': 'লোড হচ্ছে...',
        'profileUserId': '০',
        'profileReferrals': '০'
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }
}

async function copyReferralLink() {
    if (!userData) return;
    
    const refLink = `https://t.me/sohojincomebot?startapp=ref${userData.id}`;
    
    try {
        await navigator.clipboard.writeText(refLink);
        showNotification('✅ রেফারেল লিঙ্ক কপি হয়েছে!', 'success');
    } catch (error) {
        const tempInput = document.createElement('input');
        tempInput.value = refLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        showNotification('✅ রেফারেল লিঙ্ক কপি হয়েছে!', 'success');
    }
}

function showNotification(message, type = 'info') {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showPopup({
            title: type === 'success' ? 'সফল!' : 'মেসেজ',
            message: message,
            buttons: [{ type: 'close' }]
        });
    } else {
        alert(message);
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

function canWatchMoreAds() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_ad_reset);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    if (hoursDiff >= 1) return true;
    return userData.today_ads < 10;
}

function canWatchMoreBonusAds() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_bonus_ad_reset);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    if (hoursDiff >= 1) return true;
    return (userData.today_bonus_ads || 0) < 10;
}

function getTimeUntilNextReset() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_ad_reset);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
    const timeDiff = nextReset - now;
    
    if (timeDiff <= 0) return 'এখনই রিসেট হবে';
    
    const minutes = Math.ceil(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
    } else {
        return `${minutes} মিনিট`;
    }
}

function getTimeUntilNextBonusReset() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_bonus_ad_reset);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
    const timeDiff = nextReset - now;
    
    if (timeDiff <= 0) return 'এখনই রিসেট হবে';
    
    const minutes = Math.ceil(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
    } else {
        return `${minutes} মিনিট`;
    }
}

window.copyReferralLink = copyReferralLink;
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.canWatchMoreAds = canWatchMoreAds;
window.getTimeUntilNextReset = getTimeUntilNextReset;
window.canWatchMoreBonusAds = canWatchMoreBonusAds;
window.getTimeUntilNextBonusReset = getTimeUntilNextBonusReset;

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeUserData, 1000);
});
