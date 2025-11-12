
// app.js - With New Firebase Configuration
console.log("🚀 App.js loading...");

const tg = window.Telegram?.WebApp;

// NEW FIREBASE CONFIGURATION
const firebaseConfig = {
  apiKey: "AIzaSyC8PAeOIs4Tf5qGLj_d4DzC1D6Z5AEw5yA",
  authDomain: "newreffer-dc7f3.firebaseapp.com",
  projectId: "newreffer-dc7f3",
  storageBucket: "newreffer-dc7f3.firebasestorage.app",
  messagingSenderId: "60384156805",
  appId: "1:60384156805:web:8be9b4d64d15082dcc1dec",
  measurementId: "G-X5F80G5R07"
};

// Firebase initialization
let db;
let isFirebaseInitialized = false;

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    db = firebase.firestore();
    
    // Enable offline persistence
    db.enablePersistence()
      .catch((err) => {
          console.log("Persistence failed:", err);
      });
    
    isFirebaseInitialized = true;
    console.log("✅ New Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    isFirebaseInitialized = false;
}

// Global user data with local storage fallback
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

        // Try Firebase first
        if (isFirebaseInitialized) {
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                
                if (userDoc.exists) {
                    userData = userDoc.data();
                    console.log("✅ User data loaded from New Firebase");
                    
                    // Check and reset ads
                    await checkAndResetAds();
                } else {
                    userData = createNewUserData(userId);
                    await saveUserToFirebase(userData);
                    console.log("✅ New user created in New Firebase");
                }
            } catch (firebaseError) {
                console.error("❌ New Firebase error, using local storage:", firebaseError);
                await initializeWithLocalStorage(userId);
            }
        } else {
            await initializeWithLocalStorage(userId);
        }

        updateUI();
        hideLoading();

        // Load referral count
        setTimeout(() => loadReferralCount(), 1000);
        
        // Process referral
        setTimeout(() => processReferralWithStartApp(), 2000);
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        await initializeWithLocalStorage(tg?.initDataUnsafe?.user?.id || 'test_' + Date.now());
        hideLoading();
    }
}

// Initialize with local storage when Firebase fails
async function initializeWithLocalStorage(userId) {
    const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
    
    if (localData) {
        const parsedData = JSON.parse(localData);
        if (parsedData.id === userId) {
            userData = parsedData;
            console.log("✅ User data loaded from localStorage");
            return;
        }
    }
    
    userData = createNewUserData(userId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    console.log("✅ New user created in localStorage");
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

// Save user to Firebase
async function saveUserToFirebase(userData) {
    if (!isFirebaseInitialized || !db) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        return;
    }
    
    try {
        await db.collection('users').doc(userData.id).set({
            ...userData,
            lastActive: firebase.firestore.FieldValue.serverTimestamp()
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    } catch (error) {
        console.error("❌ Error saving to New Firebase:", error);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    }
}

// Check and reset ads
async function checkAndResetAds() {
    if (!userData) return;
    
    const now = new Date();
    const updates = {};
    
    // Check main ads reset
    const lastMainReset = new Date(userData.last_ad_reset);
    const mainHoursDiff = (now - lastMainReset) / (1000 * 60 * 60);
    if (mainHoursDiff >= 1) {
        updates.today_ads = 0;
        updates.last_ad_reset = now.toISOString();
    }
    
    // Check bonus ads reset
    const lastBonusReset = new Date(userData.last_bonus_ad_reset);
    const bonusHoursDiff = (now - lastBonusReset) / (1000 * 60 * 60);
    if (bonusHoursDiff >= 1) {
        updates.today_bonus_ads = 0;
        updates.last_bonus_ad_reset = now.toISOString();
    }
    
    if (Object.keys(updates).length > 0) {
        await updateUserData(updates);
    }
}

// Load referral count from Firebase
async function loadReferralCount() {
    if (!userData || !isFirebaseInitialized) return;
    
    try {
        const referralsRef = db.collection('referrals');
        const snapshot = await referralsRef.where('referredBy', '==', userData.id).get();
        
        const count = snapshot.size;
        console.log(`✅ New Firebase referral count: ${count}`);
        
        if (count !== userData.total_referrals) {
            await updateUserData({ total_referrals: count });
        }
        
    } catch (error) {
        console.error("❌ Error loading referral count from New Firebase:", error);
    }
}

// Process referral
async function processReferralWithStartApp() {
    if (!userData) return;
    
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
                await giveReferralBonuses(referrerUserId);
                
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

// Create referral record
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
        console.error("❌ Error creating referral record in New Firebase:", error);
        throw error;
    }
}

// Give referral bonuses
async function giveReferralBonuses(referrerUserId) {
    // Give 50 BDT to new user
    await updateUserData({
        balance: userData.balance + 50,
        total_income: userData.total_income + 50
    });
    
    // Give 100 BDT to referrer
    if (isFirebaseInitialized) {
        try {
            const referrerRef = db.collection('users').doc(referrerUserId);
            
            await referrerRef.update({
                balance: firebase.firestore.FieldValue.increment(100),
                total_income: firebase.firestore.FieldValue.increment(100),
                total_referrals: firebase.firestore.FieldValue.increment(1)
            });
            
        } catch (error) {
            console.error("❌ Error giving referrer bonus in New Firebase:", error);
        }
    }
}

// Update user data
async function updateUserData(updates) {
    if (!userData) return;
    
    Object.assign(userData, updates);
    
    // Update local storage immediately
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    
    // Update Firebase in background
    if (isFirebaseInitialized && db) {
        try {
            await db.collection('users').doc(userData.id).set({
                ...userData,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error("❌ Error updating New Firebase:", error);
        }
    }
    
    updateUI();
    return userData;
}

// Get user data
function getUserData() {
    return userData;
}

// Update UI
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

// Fallback UI
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

// Copy referral link
async function copyReferralLink() {
    if (!userData) return;
    
    const refLink = `https://t.me/sohojincomebot?startapp=ref${userData.id}`;
    
    try {
        await navigator.clipboard.writeText(refLink);
        await loadReferralCount();
        
        showNotification(
            `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন`, 
            'success'
        );
        
    } catch (error) {
        const tempInput = document.createElement('input');
        tempInput.value = refLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        showNotification(
            `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন`, 
            'success'
        );
    }
}

// Show notification
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

// Hide loading
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Helper functions
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

// Export functions
window.copyReferralLink = copyReferralLink;
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.canWatchMoreAds = canWatchMoreAds;
window.getTimeUntilNextReset = getTimeUntilNextReset;
window.canWatchMoreBonusAds = canWatchMoreBonusAds;
window.getTimeUntilNextBonusReset = getTimeUntilNextBonusReset;

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeUserData, 1000);
});
