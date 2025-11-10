// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
  authDomain: "sohojincome-36f1f.firebaseapp.com",
  projectId: "sohojincome-36f1f",
  storageBucket: "sohojincome-36f1f.firebasestorage.app",
  messagingSenderId: "398153090805",
  appId: "1:398153090805:web:fc8d68130afbc2239be7bc"
};

// Initialize Firebase
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase initialized');
} catch (error) {
    console.log('❌ Firebase init failed:', error);
}

// Get User ID
function getUserId() {
    const tg = window.Telegram.WebApp;
    return tg?.initDataUnsafe?.user?.id || 'unknown';
}

// Get Referral Count
async function getReferralCount(userId) {
    try {
        if (!db) {
            console.log('Firebase not available');
            return 0;
        }
        
        const doc = await db.collection('referrals').doc(userId).get();
        if (doc.exists) {
            const count = doc.data().count || 0;
            console.log('Firebase referral count:', count);
            return count;
        }
        return 0;
    } catch (error) {
        console.log('Firebase error:', error);
        return 0;
    }
}

// Track New Referral
async function trackNewReferral(referrerId, newUserId, newUserName) {
    try {
        if (!db) {
            console.log('Firebase not available');
            return false;
        }

        console.log('Tracking referral:', referrerId, '->', newUserId);

        const referrerRef = db.collection('referrals').doc(referrerId);
        const doc = await referrerRef.get();
        
        let updatedCount = 1;
        let updatedUsers = [newUserId];
        
        if (doc.exists) {
            const data = doc.data();
            updatedCount = (data.count || 0) + 1;
            updatedUsers = [...(data.referredUsers || []), newUserId];
        }
        
        await referrerRef.set({
            count: updatedCount,
            referredUsers: updatedUsers,
            referrerName: newUserName || 'Unknown',
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        console.log('✅ Referral tracked successfully:', updatedCount);
        return true;
    } catch (error) {
        console.log('❌ Referral track error:', error);
        return false;
    }
}

// Export functions
window.getReferralCount = getReferralCount;
window.trackNewReferral = trackNewReferral;