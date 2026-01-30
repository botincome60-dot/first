// app.js - Complete Firebase Version (FIXED)
console.log("🚀 Firebase App.js loading...");

const tg = window.Telegram?.WebApp;

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCDrb8fC3-nmDWAj85T9bqSaMKB9otnRgQ",
  authDomain: "reyrtyreyrty.firebaseapp.com",
  projectId: "reyrtyreyrty",
  storageBucket: "reyrtyreyrty.firebasestorage.app",
  messagingSenderId: "125368788252",
  appId: "1:125368788252:web:2bc2907576ff2239d5c6d9",
  measurementId: "G-ZYXG4GS7XE"
};

// Initialize Firebase
let db;
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
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
    console.log("🔄 Initializing user data with Firebase...");
    
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
            
            // Check and reset hourly ads if needed
            await checkAndResetHourlyAds();
            await checkAndResetBonusAds();
            await checkAndResetBonusAds2();
        } else {
            // Create new user
            userData = {
                id: userId,
                first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
                username: tg?.initDataUnsafe?.user?.username || '',
                balance: 50.00,
                today_ads: 0,
                total_ads: 0,  // 🔴 IMPORTANT: Initialize total_ads
                today_bonus_ads: 0,
                today_bonus_ads_2: 0,
                total_referrals: 0,
                total_income: 50.00,
                join_date: new Date().toISOString(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                referred_by: null,
                last_ad_reset: new Date().toISOString(),
                last_bonus_ad_reset: new Date().toISOString(),
                last_bonus_ad_reset_2: new Date().toISOString()
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
        console.log(`🕒 Hours difference: ${hoursDiff.toFixed(2)}`);
        
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
        console.log(`🕒 Hours difference: ${hoursDiff.toFixed(2)}`);
        
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

// PROCESS REFERRAL WITH STARTAPP
async function processReferralWithStartApp() {
    if (!userData) return;
    
    try {
        console.log('🔍 Processing referral with startapp...');
        
        let referralCode = null;
        
        // METHOD 1: Check Telegram start_param
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
    } else {
        // Create new document for referrer if doesn't exist
        await referrerRef.set({
            id: referrerUserId,
            first_name: 'Referrer',
            balance: 100,
            total_income: 100,
            total_referrals: 1,
            join_date: new Date().toISOString(),
            lastActive: firebase.firestore.FieldValue.serverTimestamp(),
            last_ad_reset: new Date().toISOString(),
            last_bonus_ad_reset: new Date().toISOString(),
            last_bonus_ad_reset_2: new Date().toISOString()
        });
    }
}

// Load referral count from Firebase
async function loadReferralCount() {
    if (!userData) return;
    
    try {
        const snapshot = await db.collection('referrals')
            .where('referredBy', '==', userData.id)
            .get();
        
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
    return `https://t.me/sohojincome_bot?startapp=ref${userData.id}`;
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

// 🔴🔴🔴 **CRITICAL FIX: Updated updateUserData function**
async function updateUserData(updates) {
    if (!userData || !db) return null;
    
    try {
        // Merge updates with existing userData
        Object.assign(userData, updates);
        userData.lastActive = firebase.firestore.FieldValue.serverTimestamp();
        
        // 🔴 IMPORTANT: If total_ads is being incremented, use FieldValue.increment
        if (updates.total_ads && typeof updates.total_ads === 'number') {
            await db.collection('users').doc(userData.id).update({
                ...updates,
                total_ads: firebase.firestore.FieldValue.increment(1),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Normal update
            await db.collection('users').doc(userData.id).set(userData, { merge: true });
        }
        
        // Reload user data from Firebase to ensure consistency
        const userDoc = await db.collection('users').doc(userData.id).get();
        if (userDoc.exists) {
            userData = userDoc.data();
        }
        
        updateUI();
        return userData;
    } catch (error) {
        console.error("❌ Error updating user data:", error);
        return null;
    }
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
        'totalAds': userData.total_ads || 0,  // 🔴 Fixed this line
        'profileTotalAds': userData.total_ads || 0,  // 🔴 Fixed this line
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
    
    // Update progress bars
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

// Save withdrawal to Firebase
async function saveWithdrawToFirebase(amount, accountNumber, methodName) {
    if (!userData) return;
    
    try {
        const withdrawData = {
            user_id: userData.id,
            user_name: userData.first_name,
            amount: amount,
            account_number: accountNumber,
            method: methodName,
            status: 'pending',
            request_date: new Date().toISOString(),
            timestamp: Date.now(),
            user_ads: userData.total_ads || 0,  // 🔴 Fixed this line
            user_referrals: userData.total_referrals || 0
        };
        
        await db.collection('withdrawals').add(withdrawData);
            
        console.log('✅ Withdraw request saved to Firebase');
    } catch (error) {
        console.error('Error saving withdraw request:', error);
        throw error;
    }
}

// 🔴 NEW: Function to manually fix total_ads for testing
async function fixTotalAds(count = 10) {
    if (!userData || !db) return;
    
    try {
        await db.collection('users').doc(userData.id).update({
            total_ads: count
        });
        
        // Reload user data
        const userDoc = await db.collection('users').doc(userData.id).get();
        if (userDoc.exists) {
            userData = userDoc.data();
            updateUI();
        }
        
        console.log(`✅ total_ads fixed to ${count}`);
        showNotification(`total_ads fixed to ${count}! Now try withdrawal.`, 'success');
    } catch (error) {
        console.error("Error fixing total_ads:", error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM loaded, initializing Firebase app...");
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
window.saveWithdrawToFirebase = saveWithdrawToFirebase;
window.fixTotalAds = fixTotalAds;  // 🔴 Added for testing