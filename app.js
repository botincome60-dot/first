// app.js - Fixed Referral System
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
        }

        // Get or create user ID
        let userId;
        if (tg?.initDataUnsafe?.user?.id) {
            userId = tg.initDataUnsafe.user.id.toString();
            console.log("📱 Telegram User ID:", userId);
        } else {
            // Generate random ID for browser testing
            userId = 'test_' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
            console.log("🖥️  Test User ID:", userId);
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
                balance: 50.00, // Starting bonus
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 50.00,
                join_date: new Date().toISOString(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp(),
                referred_by: null // Track who referred this user
            };
            
            await db.collection('users').doc(userId).set(userData);
            console.log("✅ New user created in Firebase");
        }

        // Update UI immediately
        updateUI();
        
        // Process referral FIRST before loading count
        await checkAndProcessReferral();
        
        // Then load referral count
        await loadReferralCount();
        
        console.log("✅ User initialization complete");
        
        // Hide loading overlay
        hideLoading();
        
    } catch (error) {
        console.error("❌ Error initializing user data:", error);
        // Fallback to basic UI
        fallbackUI();
        hideLoading();
    }
}

// Check and process referral - UPDATED VERSION
async function checkAndProcessReferral() {
    if (!userData || !db) return;
    
    try {
        console.log('🔍 Checking for referral...');
        
        // Method 1: Check Telegram Web App initData
        let referralId = null;
        
        if (tg?.initDataUnsafe?.start_param) {
            referralId = tg.initDataUnsafe.start_param;
            console.log('📱 Found referral in start_param:', referralId);
        }
        
        // Method 2: Check URL parameters (for web version)
        if (!referralId) {
            const urlParams = new URLSearchParams(window.location.search);
            const startParam = urlParams.get('startapp');
            if (startParam && startParam.startsWith('ref')) {
                referralId = startParam;
                console.log('🌐 Found referral in URL:', referralId);
            }
        }
        
        // Method 3: Check localStorage (fallback)
        if (!referralId) {
            const savedRef = localStorage.getItem('pending_referral');
            if (savedRef) {
                referralId = savedRef;
                console.log('💾 Found referral in localStorage:', referralId);
                localStorage.removeItem('pending_referral');
            }
        }
        
        if (referralId && referralId.startsWith('ref')) {
            const referrerUserId = referralId.replace('ref', '');
            console.log('🎯 Processing referral from user:', referrerUserId);
            
            // Check if this user already has a referrer
            if (userData.referred_by) {
                console.log('✅ User already has a referrer:', userData.referred_by);
                return;
            }
            
            // Check if user is referring themselves
            if (referrerUserId === userData.id) {
                console.log('🚫 User cannot refer themselves');
                return;
            }
            
            // Check if referral already exists
            const existingRef = await db.collection('referrals')
                .where('userId', '==', userData.id)
                .get();
            
            if (!existingRef.empty) {
                console.log('✅ Referral already processed');
                return;
            }
            
            console.log('✅ New referral detected, processing...');
            
            // Add referral record
            await db.collection('referrals').doc(userData.id).set({
                userId: userData.id,
                referredBy: referrerUserId,
                referrerUserId: referrerUserId,
                newUserName: userData.first_name,
                newUserId: userData.id,
                joinDate: firebase.firestore.FieldValue.serverTimestamp(),
                timestamp: Date.now(),
                status: 'completed'
            });
            
            // Update user data with referrer info
            await updateUserData({
                referred_by: referrerUserId
            });
            
            console.log('✅ Referral recorded in Firebase');
            
            // Give bonuses
            await giveReferralBonus(referrerUserId);
        }
        
    } catch (error) {
        console.error('❌ Error processing referral:', error);
    }
}

// Give referral bonus - UPDATED VERSION
async function giveReferralBonus(referrerUserId) {
    if (!userData || !db) return;
    
    try {
        console.log('💰 Giving referral bonuses...');
        
        // Give 50 BDT to new user
        await updateUserData({
            balance: userData.balance + 50,
            total_income: userData.total_income + 50
        });
        
        console.log('✅ New user got 50 BDT bonus');
        
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
            
            console.log(`✅ Referrer ${referrerUserId} got 100 BDT bonus. New count: ${newReferralCount}`);
        } else {
            console.log('❌ Referrer user not found in database');
        }
        
        showNotification('🎉 রেফারেল বোনাস! আপনি ৫০ টাকা পেয়েছেন!', 'success');
        
    } catch (error) {
        console.error('❌ Error giving referral bonus:', error);
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

// Generate referral link - UPDATED for better Telegram integration
function generateReferralLink() {
    if (!userData) return 'লোড হচ্ছে...';
    return `https://t.me/sohojincomebot?start=ref${userData.id}`;
}

// Copy referral link with better messaging
async function copyReferralLink() {
    if (!userData) {
        alert('ডেটা লোড হয়নি। রিফ্রেশ করুন।');
        return;
    }
    
    const refLink = generateReferralLink();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Load fresh count
        await loadReferralCount();
        
        const message = `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nলিঙ্ক: ${refLink}\nআপনার রেফারেল: ${userData.total_referrals} জন\n\nবন্ধুকে এই লিঙ্ক দিন, সে টেলিগ্রামে ওপেন করলে আপনি ১০০ টাকা পাবেন!`;
        
        showNotification(message, 'success');
        
    } catch (error) {
        // Fallback for browsers that don't support clipboard
        const tempInput = document.createElement('input');
        tempInput.value = refLink;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        
        const message = `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন\n\nবন্ধুকে এই লিঙ্ক দিন: ${refLink}`;
        showNotification(message, 'success');
    }
}

// Save referral for later processing (for web version)
function saveReferralForProcessing(referralCode) {
    localStorage.setItem('pending_referral', referralCode);
    console.log('💾 Saved referral for processing:', referralCode);
}

// Update user data in Firebase
async function updateUserData(updates) {
    if (!userData || !db) {
        console.error("❌ Cannot update: userData or db not available");
        return;
    }
    
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
    if (!userData) {
        console.log("❌ No user data for UI update");
        return;
    }
    
    console.log("🔄 Updating UI with user data:", userData);
    
    // Update all possible elements
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
        if (element) {
            element.textContent = value;
        }
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

// Fallback UI if Firebase fails
function fallbackUI() {
    console.log("🔄 Loading fallback UI");
    
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
        if (element) {
            element.textContent = value;
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
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 DOM loaded, initializing app...");
    setTimeout(initializeUserData, 1000);
});

// Export functions to global scope
window.copyReferralLink = copyReferralLink;
window.saveReferralForProcessing = saveReferralForProcessing;
window.getUserData = getUserData;
window.updateUserData = updateUserData;