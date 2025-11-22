// app.js - Minimal Firebase (Referrals + Withdrawals Only)
console.log("🚀 App.js loading...");

const tg = window.Telegram?.WebApp;

// Firebase initialization
let db;

// Initialize Firebase
try {
    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: "AIzaSyD0VrrvbSNN88WbJeG1MDcSeQAfYxdNlzk",
            authDomain: "ertertertert-6cfc8.firebaseapp.com",
            projectId: "ertertertert-6cfc8",
            storageBucket: "ertertertert-6cfc8.firebasestorage.app",
            messagingSenderId: "91929460922",
            appId: "1:91929460922:web:3d63fa093c3a5e271f8283",
            measurementId: "G-0Y134VSSBM"
        });
    }
    db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

// Global user data - Store locally only
let userData = null;

// Initialize user data (Local storage only)
async function initializeUserData() {
    console.log("🔄 Initializing user data...");
    
    try {
        if (tg) {
            tg.expand();
            tg.ready();
        }

        // Get user ID
        let userId;
        if (tg?.initDataUnsafe?.user?.id) {
            userId = tg.initDataUnsafe.user.id.toString();
            console.log("📱 Telegram User ID:", userId);
        } else {
            userId = 'test_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
            console.log("🖥️ Test User ID:", userId);
        }

        // Load from localStorage only - No Firebase read for user data
        const localData = localStorage.getItem(`user_${userId}`);
        
        if (localData) {
            userData = JSON.parse(localData);
            console.log("✅ User data loaded from localStorage");
            
            // Check and reset hourly ads if needed
            await checkAndResetHourlyAds();
            await checkAndResetBonusAds();
            await checkAndResetBonusAds2();
        } else {
            // Create new user locally
            userData = {
                id: userId,
                first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
                username: tg?.initDataUnsafe?.user?.username || '',
                balance: 50.00,
                today_ads: 0,
                total_ads: 0,
                today_bonus_ads: 0,
                today_bonus_ads_2: 0,
                total_referrals: 0,
                total_income: 50.00,
                join_date: new Date().toISOString(),
                referred_by: null,
                last_ad_reset: new Date().toISOString(),
                last_bonus_ad_reset: new Date().toISOString(),
                last_bonus_ad_reset_2: new Date().toISOString()
            };
            
            localStorage.setItem(`user_${userId}`, JSON.stringify(userData));
            console.log("✅ New user created locally");
        }

        updateUI();
        await processReferralWithStartApp(); // Only Firebase operation for referrals
        await loadReferralCount(); // Load referral count from Firebase
        hideLoading();
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        fallbackUI();
        hideLoading();
    }
}

// Check and reset hourly ads for main ads
async function checkAndResetHourlyAds() {
    if (!userData) return;
    
    try {
        const lastReset = new Date(userData.last_ad_reset || userData.join_date);
        const now = new Date();
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        console.log(`🕒 Last main ad reset: ${lastReset}`);
        console.log(`🕒 Hours difference: ${hoursDiff.toFixed(2)}`);
        
        // Reset if 1 hour has passed since last reset
        if (hoursDiff >= 1) {
            console.log('🔄 Resetting hourly main ads counter');
            
            await updateUserData({
                today_ads: 0,
                last_ad_reset: now.toISOString()
            });
            
            console.log('✅ Hourly main ads reset to 0');
        }
        
    } catch (error) {
        console.error('❌ Error resetting hourly main ads:', error);
    }
}

// Check and reset hourly ads for bonus ads
async function checkAndResetBonusAds() {
    if (!userData) return;
    
    try {
        const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
        const now = new Date();
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        console.log(`🕒 Last bonus ad reset: ${lastReset}`);
        
        // Reset if 1 hour has passed since last reset
        if (hoursDiff >= 1) {
            console.log('🔄 Resetting hourly bonus ads counter');
            
            await updateUserData({
                today_bonus_ads: 0,
                last_bonus_ad_reset: now.toISOString()
            });
            
            console.log('✅ Hourly bonus ads reset to 0');
        }
        
    } catch (error) {
        console.error('❌ Error resetting hourly bonus ads:', error);
    }
}

// Check and reset hourly ads for bonus ads 2
async function checkAndResetBonusAds2() {
    if (!userData) return;
    
    try {
        const lastReset = new Date(userData.last_bonus_ad_reset_2 || userData.join_date);
        const now = new Date();
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        console.log(`🕒 Last bonus ad 2 reset: ${lastReset}`);
        
        // Reset if 1 hour has passed since last reset
        if (hoursDiff >= 1) {
            console.log('🔄 Resetting hourly bonus ads 2 counter');
            
            await updateUserData({
                today_bonus_ads_2: 0,
                last_bonus_ad_reset_2: now.toISOString()
            });
            
            console.log('✅ Hourly bonus ads 2 reset to 0');
        }
        
    } catch (error) {
        console.error('❌ Error resetting hourly bonus ads 2:', error);
    }
}

// Check if user can watch more main ads
function canWatchMoreAds() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_ad_reset || userData.join_date);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    // If 1 hour has passed, user can watch ads again
    if (hoursDiff >= 1) {
        return true;
    }
    
    // Check if user hasn't reached the hourly limit
    return userData.today_ads < 10;
}

// Check if user can watch more bonus ads
function canWatchMoreBonusAds() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    // If 1 hour has passed, user can watch bonus ads again
    if (hoursDiff >= 1) {
        return true;
    }
    
    // Check if user hasn't reached the hourly limit
    return (userData.today_bonus_ads || 0) < 10;
}

// Check if user can watch more bonus ads 2
function canWatchMoreBonusAds2() {
    if (!userData) return false;
    
    const lastReset = new Date(userData.last_bonus_ad_reset_2 || userData.join_date);
    const now = new Date();
    const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
    
    // If 1 hour has passed, user can watch bonus ads again
    if (hoursDiff >= 1) {
        return true;
    }
    
    // Check if user hasn't reached the hourly limit
    return (userData.today_bonus_ads_2 || 0) < 10;
}

// Get time until next reset for main ads
function getTimeUntilNextReset() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_ad_reset || userData.join_date);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
    const timeDiff = nextReset - now;
    
    if (timeDiff <= 0) {
        return 'এখনই রিসেট হবে';
    }
    
    const minutes = Math.ceil(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
    } else {
        return `${minutes} মিনিট`;
    }
}

// Get time until next reset for bonus ads
function getTimeUntilNextBonusReset() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
    const timeDiff = nextReset - now;
    
    if (timeDiff <= 0) {
        return 'এখনই রিসেট হবে';
    }
    
    const minutes = Math.ceil(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
    } else {
        return `${minutes} মিনিট`;
    }
}

// Get time until next reset for bonus ads 2
function getTimeUntilNextBonusReset2() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_bonus_ad_reset_2 || userData.join_date);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
    const timeDiff = nextReset - now;
    
    if (timeDiff <= 0) {
        return 'এখনই রিসেট হবে';
    }
    
    const minutes = Math.ceil(timeDiff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours > 0) {
        return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
    } else {
        return `${minutes} মিনিট`;
    }
}

// PROCESS REFERRAL - ONLY FIREBASE WRITE OPERATION
async function processReferralWithStartApp() {
    if (!userData || !db) return;
    
    try {
        console.log('🔍 Processing referral...');
        
        let referralCode = null;
        
        // Check Telegram start_param
        if (tg?.initDataUnsafe?.start_param) {
            referralCode = tg.initDataUnsafe.start_param;
            console.log('🎯 Found referral code:', referralCode);
        }
        
        // Check URL parameters
        if (!referralCode) {
            const urlParams = new URLSearchParams(window.location.search);
            referralCode = urlParams.get('startapp') || urlParams.get('start');
        }
        
        if (referralCode && referralCode.startsWith('ref')) {
            const referrerUserId = referralCode.replace('ref', '');
            console.log('🔄 Processing referral from user:', referrerUserId);
            
            // Validate the referral
            if (await validateReferral(referrerUserId)) {
                // Create referral record in Firebase (ONLY FIREBASE WRITE)
                await createReferralRecord(referrerUserId);
                
                // Give bonuses to both users
                await giveReferralBonuses(referrerUserId);
                
                console.log('✅ Referral processed successfully via startapp!');
                
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

// Validate referral
async function validateReferral(referrerUserId) {
    // Check self-referral
    if (referrerUserId === userData.id) {
        console.log('🚫 Self-referral detected');
        return false;
    }
    
    // Check if user already has a referrer
    if (userData.referred_by) {
        console.log('✅ User already referred by:', userData.referred_by);
        return false;
    }
    
    // Check if referral already exists in Firebase
    try {
        const existingRef = await db.collection('referrals')
            .where('userId', '==', userData.id)
            .get();
            
        if (!existingRef.empty) {
            console.log('✅ Referral already exists in Firebase');
            return false;
        }
    } catch (error) {
        console.error('Error checking existing referral:', error);
        return false;
    }
    
    return true;
}

// Create referral record in Firebase (ONLY FIREBASE WRITE)
async function createReferralRecord(referrerUserId) {
    const referralData = {
        userId: userData.id,
        referredBy: referrerUserId,
        referrerUserId: referrerUserId,
        newUserName: userData.first_name,
        newUserId: userData.id,
        joinDate: firebase.firestore.FieldValue.serverTimestamp(),
        timestamp: Date.now(),
        status: 'completed',
        source: 'telegram_startapp'
    };
    
    await db.collection('referrals').doc(userData.id).set(referralData);
    
    // Update user with referrer info locally
    await updateUserData({
        referred_by: referrerUserId
    });
}

// Give referral bonuses
async function giveReferralBonuses(referrerUserId) {
    // Give 50 BDT to new user (local only)
    await updateUserData({
        balance: userData.balance + 50,
        total_income: userData.total_income + 50
    });
    
    // Give 100 BDT to referrer (Firebase write)
    try {
        const referrerRef = db.collection('users').doc(referrerUserId);
        const referrerDoc = await referrerRef.get();
        
        if (referrerDoc.exists) {
            const referrerData = referrerDoc.data();
            await referrerRef.update({
                balance: (referrerData.balance || 0) + 100,
                total_income: (referrerData.total_income || 0) + 100,
                total_referrals: firebase.firestore.FieldValue.increment(1)
            });
        } else {
            // Create referrer if doesn't exist
            await referrerRef.set({
                balance: 100,
                total_income: 100,
                total_referrals: 1,
                first_name: 'Referrer',
                userId: referrerUserId,
                join_date: new Date().toISOString()
            });
        }
    } catch (error) {
        console.error('Error updating referrer:', error);
    }
}

// Load referral count from Firebase
async function loadReferralCount() {
    if (!userData || !db) return;
    
    try {
        const referralsRef = db.collection('referrals');
        const snapshot = await referralsRef.where('referredBy', '==', userData.id).get();
        
        const count = snapshot.size;
        if (count !== userData.total_referrals) {
            await updateUserData({ total_referrals: count });
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
    if (!userData) {
        alert('ডেটা লোড হয়নি। রিফ্রেশ করুন।');
        return;
    }
    
    const refLink = generateReferralLink();
    
    try {
        await navigator.clipboard.writeText(refLink);
        await loadReferralCount();
        
        showNotification(
            `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন`, 
            'success'
        );
        
    } catch (error) {
        // Fallback
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

// Save user data locally only
function saveUserDataLocally() {
    if (userData) {
        localStorage.setItem(`user_${userData.id}`, JSON.stringify(userData));
        updateUI();
    }
}

// Update user data locally
async function updateUserData(updates) {
    if (!userData) return;
    
    Object.assign(userData, updates);
    saveUserDataLocally();
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
        'bonusAdsCount2': (userData.today_bonus_ads_2 || 0) + '/10',
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
    
    // Update progress bar for main ads
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = (userData.today_ads / 10) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Update progress bar for bonus ads
    const bonusProgressBar = document.getElementById('bonusProgressBar');
    if (bonusProgressBar) {
        const bonusProgress = ((userData.today_bonus_ads || 0) / 10) * 100;
        bonusProgressBar.style.width = `${bonusProgress}%`;
    }
    
    // Update progress bar for bonus ads 2
    const bonusProgressBar2 = document.getElementById('bonusProgressBar2');
    if (bonusProgressBar2) {
        const bonusProgress2 = ((userData.today_bonus_ads_2 || 0) / 10) * 100;
        bonusProgressBar2.style.width = `${bonusProgress2}%`;
    }
    
    // Update ads remaining for main ads
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
        'bonusAdsCount2': '0/10',
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
    console.log("🚀 DOM loaded, initializing app...");
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
window.canWatchMoreBonusAds2 = canWatchMoreBonusAds2;
window.getTimeUntilNextBonusReset2 = getTimeUntilNextBonusReset2;