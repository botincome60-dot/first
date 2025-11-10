// Firebase Configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
  authDomain: "sohojincome-36f1f.firebaseapp.com",
  projectId: "sohojincome-36f1f",
  storageBucket: "sohojincome-36f1f.firebasestorage.app",
  messagingSenderId: "398153090805",
  appId: "1:398153090805:web:fc8d68130afbc2239be7bc",
  measurementId: "G-VZ47961SJV"
};

// Firebase Initialize
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('✅ Firebase initialized for referrals');
} catch (error) {
    console.log('Firebase init error:', error);
}

// Telegram User ID
function getUserId() {
    const tg = window.Telegram.WebApp;
    return tg?.initDataUnsafe?.user?.id || 'demo-user';
}

// Track New Referral
async function trackNewReferral(referrerId, newUserId, newUserName) {
    try {
        if (!db) {
            console.log('Firebase not available');
            return false;
        }

        const referrerRef = db.collection('referrals').doc(referrerId.toString());
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
        });
        
        console.log(`✅ New referral: ${referrerId} -> ${newUserName}, Total: ${updatedCount}`);
        return true;
    } catch (error) {
        console.log('Referral track error:', error);
        return false;
    }
}

// Get Referral Count
async function getReferralCount(userId) {
    try {
        if (!db) return 0;
        
        const doc = await db.collection('referrals').doc(userId.toString()).get();
        return doc.exists ? (doc.data().count || 0) : 0;
    } catch (error) {
        return 0;
    }
}

// Update User Balance in Firebase
async function updateUserBalance(userId, amount) {
    try {
        if (!db) return false;

        const userRef = db.collection('users').doc(userId.toString());
        const doc = await userRef.get();
        
        if (doc.exists) {
            const currentBalance = doc.data().balance || 0;
            await userRef.update({
                balance: currentBalance + amount,
                total_income: (doc.data().total_income || 0) + amount
            });
        } else {
            await userRef.set({
                userId: userId,
                balance: amount,
                total_income: amount,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        return true;
    } catch (error) {
        console.log('Balance update error:', error);
        return false;
    }
}

// Add Referral Bonus
async function addReferralBonus(referrerId, amount) {
    try {
        await updateUserBalance(referrerId, amount);
        console.log(`✅ ${amount} Taka bonus added for ${referrerId}`);
        return true;
    } catch (error) {
        console.log('Bonus add error:', error);
        return false;
    }
}

// Export functions
window.trackNewReferral = trackNewReferral;
window.getReferralCount = getReferralCount;
window.addReferralBonus = addReferralBonus;
window.updateUserBalance = updateUserBalance;