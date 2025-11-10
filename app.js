// app.js - Fixed Complete Version with Banner Support
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
            
            // Debug: Log all Telegram data
            console.log('=== TELEGRAM DEBUG INFO ===');
            console.log('📱 Telegram initDataUnsafe:', tg.initDataUnsafe);
            console.log('🔍 Telegram start_param:', tg.initDataUnsafe?.start_param);
            console.log('👤 Telegram user:', tg.initDataUnsafe?.user);
            console.log('🌐 Telegram platform:', tg.platform);
            console.log('==========================');
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
        } else {
            // Create new user
            userData = {
                id: userId,
                first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
                username: tg?.initDataUnsafe?.user?.username || '',
                balance: 50.00,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 50.00,
                join_date: new Date().toISOString(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                referred_by: null
            };
            
            await db.collection('users').doc(userId).set(userData);
            console.log("✅ New user created in Firebase");
        }

        // Update UI immediately
        updateUI();
        
        // Show welcome banner (NEW FUNCTION)
        showWelcomeBanner();
        
        // Process referral
        await processReferralWithStartApp();
        
        // Load referral count
        await loadReferralCount();
        
        console.log("✅ User initialization complete");
        
        // Hide loading overlay
        hideLoading();
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        fallbackUI();
        hideLoading();
    }
}

// BANNER MANAGEMENT FUNCTIONS (NEW)
function showWelcomeBanner() {
    const banner = document.getElementById('welcomeBanner');
    if (!banner) {
        console.log('ℹ️ No banner element found on this page');
        return;
    }
    
    const hasSeenBanner = localStorage.getItem('hasSeenWelcomeBanner');
    
    if (!hasSeenBanner) {
        banner.style.display = 'block';
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        localStorage.setItem('hasSeenWelcomeBanner', tomorrow.getTime());
        console.log('🎉 Welcome banner shown (first time)');
    } else {
        const savedTime = parseInt(hasSeenBanner);
        if (Date.now() > savedTime) {
            banner.style.display = 'block';
            const newTomorrow = new Date();
            newTomorrow.setDate(newTomorrow.getDate() + 1);
            localStorage.setItem('hasSeenWelcomeBanner', newTomorrow.getTime());
            console.log('🎉 Welcome banner shown (24 hours passed)');
        } else {
            banner.style.display = 'none';
            console.log('ℹ️ Welcome banner hidden (24 hours not passed)');
        }
    }
}

function closeBanner() {
    const banner = document.getElementById('welcomeBanner');
    if (banner) {
        banner.style.display = 'none';
        console.log('✅ Banner closed by user');
    }
}

function hideLoading() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.display = 'none';
        console.log('✅ Loading overlay hidden');
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
        
        // METHOD 3: Check localStorage (fallback)
        if (!referralCode) {
            referralCode = localStorage.getItem('pending_referral_startapp');
            if (referralCode) {
                console.log('💾 Found referral code in localStorage:', referralCode);
                localStorage.removeItem('pending_referral_startapp');
            }
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
        } else {
            console.log('ℹ️ No referral code found or invalid format');
        }
        
    } catch (error) {
        console.error('❌ Error processing referral:', error);
    }
}

// Validate referral
async function validateReferral(referrerUserId) {
    console.log('🔍 Validating referral...');
    
    // Check if user is referring themselves
    if (referrerUserId === userData.id) {
        console.log('🚫 Self-referral detected');
        showNotification('আপনি নিজেকে রেফার করতে পারবেন না!', 'error');
        return false;
    }
    
    // Check if user already has a referrer
    if (userData.referred_by) {
        console.log('✅ User already referred by:', userData.referred_by);
        return false;
    }
    
    // Check if referral already exists in database
    const existingRef = await db.collection('referrals')
        .where('userId', '==', userData.id)
        .get();
        
    if (!existingRef.empty) {
        console.log('✅ Referral already exists in database');
        return false;
    }
    
    // Check if referrer exists in users collection
    try {
        const referrerDoc = await db.collection('users').doc(referrerUserId).get();
        if (!referrerDoc.exists) {
            console.log('❌ Referrer not found in database');
            showNotification('রেফারার একাউন্ট খুঁজে পাওয়া যায়নি!', 'error');
            return false;
        }
        console.log('✅ Referrer found in database');
    } catch (error) {
        console.log('❌ Error checking referrer:', error);
        return false;
    }
    
    console.log('✅ Referral validation passed');
    return true;
}

// Create referral record
async function createReferralRecord(referrerUserId) {
    console.log('📝 Creating referral record...');
    
    const referralData = {
        userId: userData.id,
        referredBy: referrerUserId,
        referrerUserId: referrerUserId,
        newUserName: userData.first_name,
        newUserId: userData.id,
        joinDate: firebase.firestore.FieldValue.serverTimestamp(),
        timestamp: Date.now(),
        status: 'completed',
        source: 'telegram_startapp',
        startapp_param: tg?.initDataUnsafe?.start_param || 'direct'
    };
    
    await db.collection('referrals').doc(userData.id).set(referralData);
    
    // Update current user with referrer info
    await updateUserData({
        referred_by: referrerUserId
    });
    
    console.log('✅ Referral record created successfully');
}

// Give referral bonuses
async function giveReferralBonuses(referrerUserId) {
    console.log('💰 Giving referral bonuses...');
    
    try {
        // Give 50 BDT to new user (current user)
        await updateUserData({
            balance: userData.balance + 50,
            total_income: userData.total_income + 50
        });
        
        console.log('✅ New user received 50 BDT bonus');
        
        // Give 100 BDT to referrer and increment their referral count
        const referrerRef = db.collection('users').doc(referrerUserId);
        const referrerDoc = await referrerRef.get();
        
        if (referrerDoc.exists) {
            const referrerData = referrerDoc.data();
            const newBalance = (referrerData.balance || 0) + 100;
            const newTotalIncome = (referrerData.total_income || 0) + 100;
            const newReferralCount = (referrerData.total_referrals || 0) + 1;
            
            await referrerRef.update({
                balance: newBalance,
                total_income: newTotalIncome,
                total_referrals: newReferralCount,
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`✅ Referrer ${referrerUserId} received 100 BDT. New referral count: ${newReferralCount}`);
        }
        
    } catch (error) {
        console.error('❌ Error giving bonuses:', error);
        throw error;
    }
}

// Load referral count from Firebase
async function loadReferralCount() {
    if (!userData || !db) return;
    
    try {
        const referralsRef = db.collection('referrals');
        const snapshot = await referralsRef.where('referredBy', '==', userData.id).get();
        
        const count = snapshot.size;
        console.log(`📊 Referral count for ${userData.id}: ${count}`);
        
        if (count !== userData.total_referrals) {
            await updateUserData({ total_referrals: count });
        }
    } catch (error) {
        console.error("❌ Error loading referral count:", error);
    }
}

// Generate referral link with startapp
function generateReferralLink() {
    if (!userData) return 'লোড হচ্ছে...';
    // Use startapp for direct mini app opening
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
            `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nলিঙ্ক: ${refLink}\nআপনার রেফারেল: ${userData.total_referrals} জন\n\nবন্ধুকে এই লিঙ্ক দিন, সে ক্লিক করলেই সরাসরি অ্যাপ ওপেন হবে এবং আপনি ১০০ টাকা পাবেন!`, 
            'success'
        );
        
    } catch (error) {
        // Fallback for browsers without clipboard support
        const tempInput = document.createElement('input');
        tempInput.value = refLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        showNotification(
            `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন\n\nলিঙ্ক: ${refLink}`, 
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
        console.log("✅ User data updated in Firebase");
        
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
    if (!userData) return;
    
    const elements = {
        'userName': userData.first_name,
        'profileName': userData.first_name,
        'mainBalance': userData.balance.toFixed(2) + ' টাকা',
        'withdrawBalance': userData.balance.toFixed(2) + ' টাকা',
        'todayAds': userData.today_ads + '/10',
        'adsCounter': userData.today_ads + '/10',
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
    
    // Update progress bar
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        const progress = (userData.today_ads / 10) * 100;
        progressBar.style.width = `${progress}%`;
    }
    
    // Update ads remaining
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
    const title = type === 'success' ? 'সফল!' : 
                 type === 'error' ? 'ত্রুটি!' : 'মেসেজ';
    
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.showPopup({
            title: title,
            message: message,
            buttons: [{ type: 'close' }]
        });
    } else {
        alert(message);
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
window.closeBanner = closeBanner;
window.hideLoading = hideLoading;