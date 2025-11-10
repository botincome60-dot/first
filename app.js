// app.js - Firebase-based user management
const tg = window.Telegram.WebApp;

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
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

// User data management
let userData = null;

async function initializeUserData() {
    if (tg) {
        tg.expand();
        tg.ready();
    }

    const userId = tg?.initDataUnsafe?.user?.id || Math.floor(1000000000 + Math.random() * 9000000000);
    
    try {
        // Get user data from Firebase
        const userDoc = await db.collection('users').doc(userId.toString()).get();
        
        if (userDoc.exists) {
            userData = userDoc.data();
            console.log('User data loaded from Firebase:', userData);
        } else {
            // Create new user
            userData = {
                id: userId.toString(),
                first_name: tg?.initDataUnsafe?.user?.first_name || 'ইউজার',
                balance: 0.00,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 0.00,
                join_date: new Date().toISOString(),
                lastActive: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await db.collection('users').doc(userId.toString()).set(userData);
            console.log('New user created in Firebase');
        }
        
        // Update UI
        updateUI();
        
        // Check for referral
        setTimeout(() => {
            checkAndProcessReferral();
        }, 3000);
        
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

async function updateUserData(updates) {
    if (!userData || !db) return;
    
    try {
        Object.assign(userData, updates);
        userData.lastActive = firebase.firestore.FieldValue.serverTimestamp();
        
        await db.collection('users').doc(userData.id).set(userData, { merge: true });
        console.log('User data updated in Firebase');
        
        updateUI();
        return userData;
    } catch (error) {
        console.error('Error updating user data:', error);
    }
}

function getUserData() {
    return userData;
}

// Generate referral link
function generateReferralLink() {
    if (!userData) return '';
    return `https://t.me/sohojincomebot?start=ref${userData.id}`;
}

// Load referral count from Firebase
async function loadReferralCount() {
    if (!userData || !db) return;
    
    try {
        const referralsRef = db.collection('referrals');
        const snapshot = await referralsRef.where('referredBy', '==', userData.id).get();
        
        const count = snapshot.size;
        console.log(`Referral count for ${userData.id}: ${count}`);
        
        if (count !== userData.total_referrals) {
            await updateUserData({ total_referrals: count });
        }
    } catch (error) {
        console.error('Error loading referral count:', error);
    }
}

// Copy referral link
async function copyReferralLink() {
    if (!userData) return;
    
    const refLink = generateReferralLink();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Load fresh count
        await loadReferralCount();
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${userData.total_referrals} জন`);
        }
    } catch (error) {
        alert('লিঙ্ক কপি করতে সমস্যা হয়েছে!');
    }
}

// Update UI
function updateUI() {
    if (!userData) return;
    
    if (document.getElementById('userName')) {
        document.getElementById('userName').textContent = userData.first_name;
        document.getElementById('mainBalance').textContent = userData.balance.toFixed(2) + ' টাকা';
        document.getElementById('todayAds').textContent = userData.today_ads + '/10';
        document.getElementById('totalReferrals').textContent = userData.total_referrals;
        document.getElementById('totalReferrals2').textContent = userData.total_referrals;
        document.getElementById('totalAds').textContent = userData.total_ads;
        document.getElementById('totalIncome').textContent = userData.total_income.toFixed(2) + ' টাকা';
        document.getElementById('referralLink').textContent = generateReferralLink();
    }
}

// Complete ad watch
async function completeAdWatch() {
    if (!userData) return;
    
    await updateUserData({ 
        balance: userData.balance + 30,
        total_income: userData.total_income + 30,
        total_ads: userData.total_ads + 1,
        today_ads: userData.today_ads + 1
    });
    
    alert('🎉 এড দেখা সম্পন্ন! ৩০ টাকা যোগ হয়েছে।');
}

// Withdraw check
function checkWithdraw() {
    if (!userData) return false;
    
    if (userData.total_referrals < 15) {
        alert(`🚫 Withdraw অযোগ্য!\n\nআপনার ${15 - userData.total_referrals}টি আরও রেফারেল দরকার!\n\nআপনার রেফারেল: ${userData.total_referrals} জন\nপ্রয়োজন: ১৫ জন`);
        return false;
    }
    return true;
}

// Check and process referral
async function checkAndProcessReferral() {
    if (!userData || !db) return;
    
    try {
        console.log('Checking for referral...');
        
        // Get URL parameters to check for referral
        const urlParams = new URLSearchParams(window.location.search);
        const startParam = urlParams.get('start');
        
        console.log('URL start param:', startParam);
        
        if (startParam && startParam.startsWith('ref')) {
            const refUserId = startParam;
            console.log('Referral detected:', refUserId);
            
            // Check if this referral was already processed
            const processedRef = await db.collection('referrals')
                .where('userId', '==', userData.id)
                .where('referredBy', '==', refUserId.replace('ref', ''))
                .get();
            
            if (!processedRef.empty) {
                console.log('Referral already processed');
                return;
            }
            
            // Track the referral
            const success = await trackReferral(refUserId);
            
            if (success) {
                // Give bonus to both users
                await giveReferralBonus(refUserId);
            }
        }
    } catch (error) {
        console.error('Error processing referral:', error);
    }
}

// Track referral
async function trackReferral(refUserId) {
    if (!userData || !db) return false;
    
    try {
        if (!refUserId) return false;
        
        // Extract referral ID from parameter (format: ref7070041932)
        const referralId = refUserId.replace('ref', '');
        
        if (!referralId || isNaN(referralId)) {
            console.log('Invalid referral ID');
            return false;
        }

        // Check if this user already has referral data
        const existingRef = await db.collection('referrals')
            .where('userId', '==', userData.id)
            .get();
        
        if (!existingRef.empty) {
            console.log('User already has referral data');
            return false;
        }

        // Add new user with referral info
        await db.collection('referrals').doc(userData.id).set({
            userId: userData.id,
            referredBy: referralId,
            joinDate: firebase.firestore.FieldValue.serverTimestamp(),
            first_name: userData.first_name || 'User',
            timestamp: Date.now()
        });

        console.log('Referral tracked successfully in Firebase');
        return true;
    } catch (error) {
        console.error('Error tracking referral:', error);
        return false;
    }
}

// Give referral bonus
async function giveReferralBonus(refUserId) {
    if (!userData || !db) return;
    
    try {
        const referralId = refUserId.replace('ref', '');
        
        // Give bonus to current user (new user)
        const newUserBonus = 50;
        await updateUserData({
            balance: userData.balance + newUserBonus,
            total_income: userData.total_income + newUserBonus
        });
        
        // Give bonus to referrer
        const referrerBonus = 100;
        
        // Update referrer's data in Firebase
        const referrerRef = db.collection('users').doc(referralId);
        const referrerDoc = await referrerRef.get();
        
        if (referrerDoc.exists) {
            const referrerData = referrerDoc.data();
            await referrerRef.update({
                balance: (referrerData.balance || 0) + referrerBonus,
                total_income: (referrerData.total_income || 0) + referrerBonus,
                total_referrals: (referrerData.total_referrals || 0) + 1
            });
        }
        
        console.log('Referral bonuses given successfully');
        
        // Show success message
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "রেফারেল বোনাস!",
                message: `আপনি রেফারেল দ্বারা জয়েন করেছেন! ${newUserBonus} টাকা বোনাস পেয়েছেন।`,
                buttons: [{ type: "close" }]
            });
        }
        
    } catch (error) {
        console.error('Error giving referral bonus:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', initializeUserData);

// Export functions
window.copyReferralLink = copyReferralLink;
window.completeAdWatch = completeAdWatch;
window.checkWithdraw = checkWithdraw;