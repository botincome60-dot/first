
// app.js - Optimized for Old Firebase (Quota Reset)
console.log("🚀 App.js loading...");

const tg = window.Telegram?.WebApp;

// OLD FIREBASE CONFIGURATION (Quota reset হয়ে গেছে)
const firebaseConfig = {
    apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
    authDomain: "sohojincome-36f1f.firebaseapp.com",
    projectId: "sohojincome-36f1f",
    storageBucket: "sohojincome-36f1f.firebasestorage.app",
    messagingSenderId: "398153090805",
    appId: "1:398153090805:web:fc8d68130afbc2239be7bc",
    measurementId: "G-VZ47961SJV"
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
    console.log("✅ OLD Firebase initialized successfully (Quota Reset)");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
    isFirebaseInitialized = false;
}

// Global user data with local storage fallback
let userData = null;
const LOCAL_STORAGE_KEY = 'sohojincome_userdata';

// Initialize user data - OPTIMIZED FOR MINIMAL READS/WRITES
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

        // OPTIMIZATION: Try local storage first
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            const parsedData = JSON.parse(localData);
            if (parsedData.id === userId) {
                userData = parsedData;
                console.log("✅ User data loaded from localStorage");
                
                updateUI();
                hideLoading();
                
                // Background Firebase sync
                setTimeout(() => syncWithFirebase(userId), 1000);
                setTimeout(() => loadReferralCount(), 1500);
                setTimeout(() => processReferralWithStartApp(), 2000);
                return;
            }
        }

        // Firebase initialization
        if (isFirebaseInitialized) {
            try {
                const userDoc = await db.collection('users').doc(userId).get();
                
                if (userDoc.exists) {
                    userData = userDoc.data();
                    console.log("✅ User data loaded from OLD Firebase");
                    
                    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
                    await checkAndResetAds();
                } else {
                    userData = createNewUserData(userId);
                    await saveUserToFirebase(userData);
                    console.log("✅ New user created in OLD Firebase");
                }
            } catch (firebaseError) {
                console.error("❌ OLD Firebase error:", firebaseError);
                await initializeWithLocalStorage(userId);
            }
        } else {
            await initializeWithLocalStorage(userId);
        }

        updateUI();
        hideLoading();

        setTimeout(() => loadReferralCount(), 1000);
        setTimeout(() => processReferralWithStartApp(), 2000);
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        await initializeWithLocalStorage(tg?.initDataUnsafe?.user?.id || 'test_' + Date.now());
        hideLoading();
    }
}

// Initialize with local storage
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

// Sync with Firebase in background
async function syncWithFirebase(userId) {
    if (!isFirebaseInitialized || !db) return;
    
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        if (userDoc.exists) {
            const firebaseData = userDoc.data();
            
            // Merge important data (balance, referrals, etc.)
            if (firebaseData.balance > userData.balance) {
                userData.balance = firebaseData.balance;
                userData.total_income = firebaseData.total_income;
            }
            if (firebaseData.total_referrals > userData.total_referrals) {
                userData.total_referrals = firebaseData.total_referrals;
            }
            
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
            updateUI();
        }
    } catch (error) {
        console.error("❌ Sync error:", error);
    }
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
        console.error("❌ Error saving to OLD Firebase:", error);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    }
}

// Check and reset ads - LOCAL STORAGE ONLY
async function checkAndResetAds() {
    if (!userData) return;
    
    const now = new Date();
    const updates = {};
    
    const lastMainReset = new Date(userData.last_ad_reset);
    const mainHoursDiff = (now - lastMainReset) / (1000 * 60 * 60);
    if (mainHoursDiff >= 1) {
        updates.today_ads = 0;
        updates.last_ad_reset = now.toISOString();
    }
    
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
        console.log(`✅ OLD Firebase referral count: ${count}`);
        
        if (count !== userData.total_referrals) {
            await updateUserData({ total_referrals: count });
        }
        
    } catch (error) {
        console.error("❌ Error loading referral count from OLD Firebase:", error);
    }
}

// Process referral with batch operations
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
                // Use batch operation for minimal writes
                await processReferralBatch(referrerUserId);
            }
        }
    } catch (error) {
        console.error('❌ Error processing referral:', error);
    }
}

// Batch operation for referral processing
async function processReferralBatch(referrerUserId) {
    const batch = db.batch();
    
    // 1. Create referral record
    const referralRef = db.collection('referrals').doc(userData.id);
    batch.set(referralRef, {
        userId: userData.id,
        referredBy: referrerUserId,
        newUserName: userData.first_name,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 2. Update current user
    const userRef = db.collection('users').doc(userData.id);
    batch.update(userRef, {
        balance: firebase.firestore.FieldValue.increment(50),
        total_income: firebase.firestore.FieldValue.increment(50),
        referred_by: referrerUserId,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 3. Update referrer
    const referrerRef = db.collection('users').doc(referrerUserId);
    batch.update(referrerRef, {
        balance: firebase.firestore.FieldValue.increment(100),
        total_income: firebase.firestore.FieldValue.increment(100),
        total_referrals: firebase.firestore.FieldValue.increment(1),
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    try {
        await batch.commit();
        
        // Update local storage
        userData.balance += 50;
        userData.total_income += 50;
        userData.referred_by = referrerUserId;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
        
        updateUI();
        
        showNotification(
            '🎉 রেফারেল সফল!\n\nআপনি রেফারেল দ্বারা জয়েন করেছেন। ৫০ টাকা বোনাস পেয়েছেন!',
            'success'
        );
        
    } catch (error) {
        console.error('❌ Error in referral batch:', error);
    }
}

// Update user data - LOCAL STORAGE FIRST
async function updateUserData(updates) {
    if (!userData) return;
    
    Object.assign(userData, updates);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    updateUI();
    
    // Background Firebase update
    if (isFirebaseInitialized && db) {
        setTimeout(async () => {
            try {
                await db.collection('users').doc(userData.id).set({
                    ...userData,
                    lastActive: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
            } catch (error) {
                console.error("❌ Background update error:", error);
            }
        }, 1000);
    }
    
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
        'mainBalance': '50.00 টাকা',
        'todayAds': '0/10',
        'totalReferrals': '0',
        'totalIncome': '50.00 টাকা',
        'referralLink': 'লোড হচ্ছে...'
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
