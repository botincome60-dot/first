// Firebase initialization
const firebaseConfig = {
    apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
  authDomain: "sohojincome-36f1f.firebaseapp.com",
  projectId: "sohojincome-36f1f",
  storageBucket: "sohojincome-36f1f.firebasestorage.app",
  messagingSenderId: "398153090805",
  appId: "1:398153090805:web:fc8d68130afbc2239be7bc",
  measurementId: "G-VZ47961SJV"
};

// Initialize Firebase
try {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  console.log("Firebase initialized successfully");
} catch (error) {
  console.error("Firebase initialization error:", error);
}

const db = firebase.firestore();

// Referral system functions
async function trackReferral(refUserId) {
  try {
    if (!refUserId) return false;
    
    // Extract referral ID from parameter (format: ref7070041932)
    const referralId = refUserId.replace('ref', '');
    
    if (!referralId || isNaN(referralId)) {
      console.log('Invalid referral ID');
      return false;
    }

    // Get current user data
    const currentUser = getUserData();
    
    // Check if this user already has referral data
    const userRef = db.collection('referrals').doc(currentUser.id.toString());
    const userDoc = await userRef.get();
    
    if (userDoc.exists) {
      console.log('User already exists in referrals');
      return false;
    }

    // Add new user with referral info
    await userRef.set({
      userId: currentUser.id.toString(),
      referredBy: referralId,
      joinDate: firebase.firestore.FieldValue.serverTimestamp(),
      first_name: currentUser.first_name || 'User'
    });

    console.log('Referral tracked successfully');
    return true;
  } catch (error) {
    console.error('Error tracking referral:', error);
    return false;
  }
}

async function getReferralCount(userId) {
  try {
    if (!userId) return 0;
    
    const referralsRef = db.collection('referrals');
    const snapshot = await referralsRef.where('referredBy', '==', userId.toString()).get();
    
    const count = snapshot.size;
    console.log(`Referral count for ${userId}: ${count}`);
    return count;
  } catch (error) {
    console.error('Error getting referral count:', error);
    return 0;
  }
}

async function checkAndProcessReferral() {
  try {
    // Get URL parameters to check for referral
    const urlParams = new URLSearchParams(window.location.search);
    const startParam = urlParams.get('start');
    
    if (startParam && startParam.startsWith('ref')) {
      const refUserId = startParam;
      console.log('Referral detected:', refUserId);
      
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

async function giveReferralBonus(refUserId) {
  try {
    const referralId = refUserId.replace('ref', '');
    const currentUser = getUserData();
    
    // Give bonus to current user (new user)
    const newUserBonus = 50;
    updateUserData({
      balance: currentUser.balance + newUserBonus,
      total_income: currentUser.total_income + newUserBonus
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
    } else {
      // Create new document for referrer if doesn't exist
      await referrerRef.set({
        balance: referrerBonus,
        total_income: referrerBonus,
        total_referrals: 1,
        first_name: 'Referrer',
        userId: referralId
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

// Initialize referral check when page loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    checkAndProcessReferral();
  }, 2000);
});