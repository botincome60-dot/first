// app.js - Fixed with Hourly AD Reset System and Bonus Ads
console.log("🚀 App.js loading...");

const tg = window.Telegram?.WebApp;

// Firebase initialization
let db;

// Initialize Firebase immediately
try {
    if (!firebase.apps.length) {
        firebase.initializeApp({
            apiKey: "AIzaSyC8PAeOIs4Tf5qGLj_d4DzC1D6Z5AEw5yA",
            authDomain: "newreffer-dc7f3.firebaseapp.com",
            projectId: "newreffer-dc7f3",
            storageBucket: "newreffer-dc7f3.firebasestorage.app",
            messagingSenderId: "60384156805",
            appId: "1:60384156805:web:8be9b4d64d15082dcc1dec",
            measurementId: "G-X5F80G5R07"
        });
    }
    db = firebase.firestore();
    console.log("✅ Firebase initialized successfully");
} catch (error) {
    console.error("❌ Firebase initialization error:", error);
}

// Global user data
let userData = null;

// Initialize user data
async function initializeUserData() {
    console.log("🔄 Initializing user data...");
    
    try {
        // Expand Telegram Web App
        if (tg) {
            tg.expand();
            tg.ready();
            console.log("✅ Telegram Web App initialized");
        }

        // Get user ID from Telegram or create test ID
        let userId;
        if (tg?.initDataUnsafe?.user?.id) {
            userId = tg.initDataUnsafe.user.id.toString();
            console.log("📱 Telegram User ID:", userId);
        } else {
            // Generate random ID for browser testing
            userId = 'test_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
            console.log("🖥️ Test User ID:", userId);
        }

        // Get user data from Firebase
        const userDoc = await db.collection('users').doc(userId).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log("✅ User data loaded from Firebase:", userData);
            
            // Check and reset daily ads if needed
            await checkAndResetHourlyAds();
            // Check and reset bonus ads if needed
            await checkAndResetBonusAds();
        } else {
            // Create new user
            userData = {
                id: userId,
                first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
                username: tg?.initDataUnsafe?.user?.username || '',
                balance: 50.00,
                today_ads: 0,
                total_ads: 0,
                today_bonus_ads: 0, // New: Bonus ads counter
                total_referrals: 0,
                total_income: 50.00,
                join_date: new Date().toISOString(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                referred_by: null,
                last_ad_reset: new Date().toISOString(), // Track last reset time for main ads
                last_bonus_ad_reset: new Date().toISOString() // New: Track last reset time for bonus ads
            };
            
            await db.collection('users').doc(userId).set(userData);
            console.log("✅ New user created in Firebase");
        }

        // Update UI immediately
        updateUI();
        
        // Process referral
        await processReferralWithStartApp();
        
        // Load referral count
        await loadReferralCount();
        
        console.log("✅ User initialization complete");
        hideLoading();
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        // Use fallback data
        userData = getFallbackUserData();
        fallbackUI();
        hideLoading();
    }
}

// Fallback user data function
function getFallbackUserData() {
    const userId = tg?.initDataUnsafe?.user?.id || 'test_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
    
    return {
        id: userId,
        first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
        username: tg?.initDataUnsafe?.user?.username || '',
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

// Check and reset hourly ads for main ads
async function checkAndResetHourlyAds() {
    if (!userData || !db) return;
    
    try {
        const lastReset = new Date(userData.last_ad_reset || userData.join_date);
        const now = new Date();
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        console.log(`🕒 Last main ad reset: ${lastReset}`);
        console.log(`🕒 Current time: ${now}`);
        console.log(`🕒 Hours difference: ${hoursDiff.toFixed(2)}`);
        
        // Reset if 1 hour has passed since last reset
        if (hoursDiff >= 1) {
            console.log('🔄 Resetting hourly main ads counter');
            
            await updateUserData({
                today_ads: 0,
                last_ad_reset: now.toISOString()
            });
            
            console.log('✅ Hourly main ads reset to 0');
        } else {
            const remainingMinutes = Math.ceil(60 - (hoursDiff * 60));
            console.log(`⏳ Next main ad reset in: ${remainingMinutes} minutes`);
        }
        
    } catch (error) {
        console.error('❌ Error resetting hourly main ads:', error);
    }
}

// NEW: Check and reset hourly ads for bonus ads
async function checkAndResetBonusAds() {
    if (!userData || !db) return;
    
    try {
        const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
        const now = new Date();
        const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
        
        console.log(`🕒 Last bonus ad reset: ${lastReset}`);
        console.log(`🕒 Hours difference: ${hoursDiff.toFixed(2)}`);
        
        // Reset if 1 hour has passed since last reset
        if (hoursDiff >= 1) {
            console.log('🔄 Resetting hourly bonus ads counter');
            
            await updateUserData({
                today_bonus_ads: 0,
                last_bonus_ad_reset: now.toISOString()
            });
            
            console.log('✅ Hourly bonus ads reset to 0');
        } else {
            const remainingMinutes = Math.ceil(60 - (hoursDiff * 60));
            console.log(`⏳ Next bonus ad reset in: ${remainingMinutes} minutes`);
        }
        
    } catch (error) {
        console.error('❌ Error resetting hourly bonus ads:', error);
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

// NEW: Check if user can watch more bonus ads
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

// Get time until next reset for main ads
function getTimeUntilNextReset() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_ad_reset || userData.join_date);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000)); // 1 hour later
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

// NEW: Get time until next reset for bonus ads
function getTimeUntilNextBonusReset() {
    if (!userData) return 'লোড হচ্ছে...';
    
    const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
    const now = new Date();
    const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000)); // 1 hour later
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

// PROCESS REFERRAL WITH STARTAPP - MAIN FUNCTION
async function processReferralWithStartApp() {
    if (!userData || !db) return;
    
    try {
        console.log('🔍 Processing referral with startapp...');
        
        let referralCode = null;
        
        // METHOD 1: Check Telegram start_param (startapp parameter)
        if (tg?.initDataUnsafe?.start_param) {
            referralCode = tg.initDataUnsafe.start_param;
            console.log('🎯 Found referral code in start_param:', referralCode);
        }
        
        // METHOD 2: Check URL parameters for startapp (web testing)
        if (!referralCode) {
            const urlParams = new URLSearchParams(window.location.search);
            referralCode = urlParams.get('startapp') || urlParams.get('start');
            console.log('🌐 Found referral code in URL:', referralCode);
        }
        
        if (referralCode && referralCode.startsWith('ref')) {
            const referrerUserId = referralCode.replace('ref', '');
            console.log('🔄 Processing referral from user:', referrerUserId);
            
            // Validate the referral
            if (await validateReferral(referrerUserId)) {
                // Create referral record
                await createReferralRecord(referrerUserId);
                
                // Give bonuses to both users
                await giveReferralBonuses(referrerUserId);
                
                console.log('✅ Referral processed successfully via startapp!');
                
                // Show success message
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
    
    // Check if referral already exists
    const existingRef = await db.collection('referrals')
        .where('userId', '==', userData.id)
        .get();
        
    if (!existingRef.empty) {
        console.log('✅ Referral already exists');
        return false;
    }
    
    return true;
}

// Create referral record
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
    
    // Update user with referrer info
    await updateUserData({
        referred_by: referrerUserId
    });
}

// Give referral bonuses
async function giveReferralBonuses(referrerUserId) {
    // Give 50 BDT to new user
    await updateUserData({
        balance: userData.balance + 50,
        total_income: userData.total_income + 50
    });
    
    // Give 100 BDT to referrer
    const referrerRef = db.collection('users').doc(referrerUserId);
    const referrerDoc = await referrerRef.get();
    
    if (referrerDoc.exists) {
        const referrerData = referrerDoc.data();
        await referrerRef.update({
            balance: (referrerData.balance || 0) + 100,
            total_income: (referrerData.total_income || 0) + 100,
            total_referrals: firebase.firestore.FieldValue.increment(1)
        });
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

// Update user data in Firebase
async function updateUserData(updates) {
    if (!userData || !db) return;
    
    try {
        Object.assign(userData, updates);
        userData.lastActive = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('users').doc(userData.id).set(userData, { merge: true });
        updateUI();
        return userData;
    } catch (error) {
        console.error("❌ Error updating user data:", error);
    }
}

// Get user data
function getUserData() {
    return userData;
}

// Update UI with user data
function updateUI() {
    if (!userData) {
        console.log("❌ No user data available for UI update");
        return;
    }
    
    console.log("🔄 Updating UI with user data:", userData);
    
    const elements = {
        'userName': userData.first_name,
        'profileName': userData.first_name,
        'mainBalance': userData.balance.toFixed(2) + ' টাকা',
        'withdrawBalance': userData.balance.toFixed(2) + ' টাকা',
        'todayAds': userData.today_ads + '/10',
        'adsCounter': userData.today_ads + '/10',
        'bonusAdsCounter': (userData.today_bonus_ads || 0) + '/10',
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
        if (element) {
            element.textContent = value;
            console.log(`✅ Updated ${id}: ${value}`);
        } else {
            console.log(`❌ Element not found: ${id}`);
        }
    }
    
    // Update progress bar for main ads
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = (userData.today_ads / 10) * 100;
        progressBar.style.width = `${progress}%`;
        console.log(`✅ Updated progress bar: ${progress}%`);
    }
    
    // Update progress bar for bonus ads
    const bonusProgressBar = document.getElementById('bonusProgressBar');
    if (bonusProgressBar) {
        const bonusProgress = ((userData.today_bonus_ads || 0) / 10) * 100;
        bonusProgressBar.style.width = `${bonusProgress}%`;
        console.log(`✅ Updated bonus progress bar: ${bonusProgress}%`);
    }
    
    // Update ads remaining for main ads
    const adsRemaining = document.getElementById('adsRemaining');
    if (adsRemaining) {
        const remaining = 10 - userData.today_ads;
        adsRemaining.textContent = remaining > 0 ? remaining : 0;
        console.log(`✅ Updated ads remaining: ${adsRemaining.textContent}`);
    }
    
    console.log("✅ UI update complete");
}

// Fallback UI
function fallbackUI() {
    console.log("🔄 Using fallback UI");
    
    const userId = tg?.initDataUnsafe?.user?.id || 'test_user';
    const userName = tg?.initDataUnsafe?.user?.first_name || 'ইউজার';
    
    const elements = {
        'userName': userName,
        'profileName': userName,
        'mainBalance': '50.00 টাকা',
        'withdrawBalance': '50.00 টাকা',
        'todayAds': '0/10',
        'adsCounter': '0/10',
        'bonusAdsCounter': '0/10',
        'totalReferrals': '0',
        'totalReferrals2': '0',
        'totalAds': '0',
        'profileTotalAds': '0',
        'totalIncome': '50.00 টাকা',
        'profileTotalIncome': '50.00 টাকা',
        'referralLink': `https://t.me/sohojincomebot?startapp=ref${userId}`,
        'supportReferralLink': `https://t.me/sohojincomebot?startapp=ref${userId}`,
        'profileUserId': userId,
        'profileReferrals': '০'
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
            console.log(`✅ Fallback updated ${id}: ${value}`);
        }
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
    if (overlay) {
        overlay.style.display = 'none';
        console.log("✅ Loading overlay hidden");
    }
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
window.updateUI = updateUI;
window.fallbackUI = fallbackUI;
window.hideLoading = hideLoading;