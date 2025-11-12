
// app.js - Minimum Read/Write with Hourly AD Reset System
console.log("🚀 App.js loading...");

const tg = window.Telegram?.WebApp;

// Firebase initialization
let db;

// Initialize Firebase immediately
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

// Global user data with local storage
let userData = null;
const LOCAL_STORAGE_KEY = 'sohojincome_userdata';

// Initialize user data - OPTIMIZED FOR MINIMAL READS
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

        // OPTIMIZATION: Try local storage first to avoid Firebase read
        const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (localData) {
            const parsedData = JSON.parse(localData);
            if (parsedData.id === userId) {
                userData = parsedData;
                console.log("✅ User data loaded from localStorage");
                
                // Update UI immediately
                updateUI();
                hideLoading();
                
                // Load referral count in background (ONLY FIREBASE READ)
                setTimeout(() => loadReferralCount(), 1000);
                
                // Process referral in background
                setTimeout(() => processReferralWithStartApp(), 2000);
                return;
            }
        }

        // Only read from Firebase if no local data
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log("✅ User data loaded from Firebase");
            
            // Save to local storage for future use
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
            
            await checkAndResetHourlyAds();
        } else {
            // Create new user
            userData = {
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
            
            // Save to both Firebase and local storage
            await db.collection('users').doc(userId).set(userData);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
            console.log("✅ New user created");
        }

        updateUI();
        hideLoading();

        // Load referral count
        setTimeout(() => loadReferralCount(), 1000);
        
        // Process referral
        setTimeout(() => processReferralWithStartApp(), 2000);
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        fallbackUI();
        hideLoading();
    }
}

// OPTIMIZED: Check and reset hourly ads - LOCAL STORAGE ONLY
async function checkAndResetHourlyAds() {
    if (!userData) return;
    
    try {
        const lastReset = new Date(userData.last_ad_reset);
        const now = new Date();
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        // Reset if 1 hour has passed - UPDATE LOCAL STORAGE ONLY
        if (hoursDiff >= 1) {
            userData.today_ads = 0;
            userData.today_bonus_ads = 0;
            userData.last_ad_reset = now.toISOString();
            userData.last_bonus_ad_reset = now.toISOString();
            
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
            updateUI();
        }
        
    } catch (error) {
        console.error('❌ Error resetting hourly ads:', error);
    }
}

// Check if user can watch more ads - LOCAL STORAGE ONLY
function canWatchMoreAds() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_ad_reset);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    if (hoursDiff >= 1) return true;
    return userData.today_ads < 10;
}

// Check if user can watch more bonus ads - LOCAL STORAGE ONLY
function canWatchMoreBonusAds() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_bonus_ad_reset);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    if (hoursDiff >= 1) return true;
    return (userData.today_bonus_ads || 0) < 10;
}

// Get time until next reset - LOCAL STORAGE ONLY
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

// OPTIMIZED: Process referral with minimal writes
async function processReferralWithStartApp() {
    if (!userData || !db) return;
    
    try {
        // Check if already processed
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
            
            // Validate (simple check)
            if (referrerUserId !== userData.id && !userData.referred_by) {
                // OPTIMIZATION: Single batch operation for referral
                await processReferralInBatch(referrerUserId);
            }
        }
    } catch (error) {
        console.error('❌ Error processing referral:', error);
    }
}

// OPTIMIZED: Single batch operation for referral processing
async function processReferralInBatch(referrerUserId) {
    const batch = db.batch();
    
    // 1. Create referral record
    const referralRef = db.collection('referrals').doc(userData.id);
    batch.set(referralRef, {
        userId: userData.id,
        referredBy: referrerUserId,
        newUserName: userData.first_name,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 2. Update current user with bonus and referrer info
    const userRef = db.collection('users').doc(userData.id);
    batch.update(userRef, {
        balance: firebase.firestore.FieldValue.increment(50),
        total_income: firebase.firestore.FieldValue.increment(50),
        referred_by: referrerUserId,
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // 3. Update referrer with bonus
    const referrerRef = db.collection('users').doc(referrerUserId);
    batch.update(referrerRef, {
        balance: firebase.firestore.FieldValue.increment(100),
        total_income: firebase.firestore.FieldValue.increment(100),
        total_referrals: firebase.firestore.FieldValue.increment(1),
        lastActive: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    try {
        // Execute all operations in single batch (REDUCED WRITES)
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

// OPTIMIZED: Load referral count (ONLY FIREBASE READ)
async function loadReferralCount() {
    if (!userData || !db) return;
    
    try {
        const referralsRef = db.collection('referrals');
        const snapshot = await referralsRef.where('referredBy', '==', userData.id).get();
        
        const count = snapshot.size;
        if (count !== userData.total_referrals) {
            userData.total_referrals = count;
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
            updateUI();
        }
    } catch (error) {
        console.error("❌ Error loading referral count:", error);
    }
}

// Generate referral link
function generateReferralLink() {
    if (!userData) return 'লোড হচ্ছে...';
    return `https://t.me/sohojincomebot?startapp=ref${userData.id}`;
}

// Copy referral link
async function copyReferralLink() {
    if (!userData) return;
    
    const refLink = generateReferralLink();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Update referral count
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

// OPTIMIZED: Update user data - LOCAL STORAGE FIRST, FIREBASE BACKGROUND
async function updateUserData(updates) {
    if (!userData) return;
    
    // Update local storage immediately
    Object.assign(userData, updates);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userData));
    updateUI();
    
    // Update Firebase in background (non-blocking)
    if (db) {
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

// Update UI with user data
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
        'referralLink': generateReferralLink(),
        'supportReferralLink': generateReferralLink(),
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

// Hide loading overlay
function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeUserData, 1000);
});

// Export functions to global scope
window.copyReferralLink = copyReferralLink;
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.canWatchMoreAds = canWatchMoreAds;
window.getTimeUntilNextReset = getTimeUntilNextReset;
window.canWatchMoreBonusAds = canWatchMoreBonusAds;
window.getTimeUntilNextBonusReset = getTimeUntilNextBonusReset;
