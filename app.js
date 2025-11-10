// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
  authDomain: "sohojincome-36f1f.firebaseapp.com",
  projectId: "sohojincome-36f1f",
  storageBucket: "sohojincome-36f1f.firebasestorage.app",
  messagingSenderId: "398153090805",
  appId: "1:398153090805:web:fc8d68130afbc2239be7bc"
};

// Firebase Initialize
let db = null;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
} catch (error) {
    console.log('Firebase error:', error);
}

// Telegram Web App
const tg = window.Telegram.WebApp;

// Get User ID
function getUserId() {
    return tg?.initDataUnsafe?.user?.id || 'demo-user';
}

// Get User Name
function getUserName() {
    return tg?.initDataUnsafe?.user?.first_name || 'ইউজার';
}

// Get User Data from Firebase
async function getUserData() {
    try {
        const userId = getUserId();
        const doc = await db.collection('users').doc(userId).get();
        
        if (doc.exists) {
            return doc.data();
        } else {
            // Create new user
            const newUser = {
                userId: userId,
                name: getUserName(),
                balance: 0,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 0,
                join_date: new Date().toISOString()
            };
            await db.collection('users').doc(userId).set(newUser);
            return newUser;
        }
    } catch (error) {
        console.log('Error getting user data:', error);
        return {
            userId: getUserId(),
            name: getUserName(),
            balance: 0,
            today_ads: 0,
            total_ads: 0,
            total_referrals: 0,
            total_income: 0
        };
    }
}

// Get Referral Count
async function getReferralCount(userId) {
    try {
        const doc = await db.collection('referrals').doc(userId).get();
        return doc.exists ? (doc.data().count || 0) : 0;
    } catch (error) {
        return 0;
    }
}

// Update Balance
async function updateBalance(amount) {
    try {
        const userId = getUserId();
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        
        if (doc.exists) {
            const currentBalance = doc.data().balance || 0;
            await userRef.update({
                balance: currentBalance + amount,
                total_income: (doc.data().total_income || 0) + amount
            });
        }
    } catch (error) {
        console.log('Balance update error:', error);
    }
}

// Track New Referral
async function trackNewReferral(referrerId, newUserId, newUserName) {
    try {
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
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Add 100 Taka bonus
        await updateBalance(100);
        
        return true;
    } catch (error) {
        console.log('Referral track error:', error);
        return false;
    }
}

// Generate Referral Link
function generateReferralLink() {
    const userId = getUserId();
    return `https://t.me/sohojincomebot?start=ref${userId}`;
}

// Copy Referral Link
async function copyReferralLink() {
    try {
        const link = generateReferralLink();
        await navigator.clipboard.writeText(link);
        
        const user = await getUserData();
        const refCount = await getReferralCount(getUserId());
        
        if (tg && tg.showPopup) {
            tg.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${refCount} জন\nব্যালেন্স: ${user.balance} টাকা`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${refCount} জন\nব্যালেন্স: ${user.balance} টাকা`);
        }
    } catch (error) {
        alert('লিঙ্ক কপি করতে সমস্যা হয়েছে!');
    }
}

// Update UI with User Data
async function updateUserUI() {
    try {
        const user = await getUserData();
        const refCount = await getReferralCount(getUserId());
        
        // Update Home Page
        if (document.getElementById('userName')) {
            document.getElementById('userName').textContent = user.name;
        }
        if (document.getElementById('mainBalance')) {
            document.getElementById('mainBalance').textContent = user.balance + ' টাকা';
        }
        if (document.getElementById('todayAds')) {
            document.getElementById('todayAds').textContent = user.today_ads + '/10';
        }
        if (document.getElementById('totalReferrals')) {
            document.getElementById('totalReferrals').textContent = refCount;
        }
        if (document.getElementById('totalReferrals2')) {
            document.getElementById('totalReferrals2').textContent = refCount;
        }
        if (document.getElementById('totalAds')) {
            document.getElementById('totalAds').textContent = user.total_ads;
        }
        if (document.getElementById('totalIncome')) {
            document.getElementById('totalIncome').textContent = user.total_income + ' টাকা';
        }
        if (document.getElementById('referralLink')) {
            document.getElementById('referralLink').textContent = generateReferralLink();
        }
        
        // Update Support Page
        if (document.getElementById('withdrawBalance')) {
            document.getElementById('withdrawBalance').textContent = user.balance + ' টাকা';
        }
        if (document.getElementById('userReferrals')) {
            document.getElementById('userReferrals').textContent = refCount;
        }
        
        // Update Profile Page
        if (document.getElementById('profileName')) {
            document.getElementById('profileName').textContent = user.name;
        }
        if (document.getElementById('profileTotalIncome')) {
            document.getElementById('profileTotalIncome').textContent = user.total_income + ' টাকা';
        }
        if (document.getElementById('profileTotalAds')) {
            document.getElementById('profileTotalAds').textContent = user.total_ads;
        }
        if (document.getElementById('profileReferrals')) {
            document.getElementById('profileReferrals').textContent = refCount;
        }
        
    } catch (error) {
        console.log('UI update error:', error);
    }
}

// Check Withdraw Eligibility
async function checkWithdrawEligibility() {
    const refCount = await getReferralCount(getUserId());
    if (refCount < 15) {
        if (tg && tg.showPopup) {
            tg.showPopup({
                title: "🚫 Withdraw অযোগ্য",
                message: `আপনার ${15 - refCount}টি আরও রেফারেল দরকার!\n\nআপনার রেফারেল: ${refCount} জন\nপ্রয়োজন: ১৫ জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`আপনার ${15 - refCount}টি আরও রেফারেল দরকার!\n\nআপনার রেফারেল: ${refCount} জন\nপ্রয়োজন: ১৫ জন`);
        }
        return false;
    }
    return true;
}

// Submit Withdraw Request
async function submitWithdrawRequest(amount, method, accountNumber) {
    try {
        const eligible = await checkWithdrawEligibility();
        if (!eligible) return;
        
        const user = await getUserData();
        if (amount > user.balance) {
            alert('আপনার ব্যালেন্স insufficient!');
            return;
        }
        
        // Save withdraw request to Firebase
        await db.collection('withdrawals').add({
            userId: getUserId(),
            userName: getUserName(),
            amount: amount,
            method: method,
            accountNumber: accountNumber,
            status: 'pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        if (tg && tg.showPopup) {
            tg.showPopup({
                title: "✅ Request Submitted",
                message: `উইথড্র রিকোয়েস্ট জমা হয়েছে!\n\nপরিমাণ: ${amount} টাকা\nমেথড: ${method}\nঅ্যাকাউন্ট: ${accountNumber}\n\n২৪ ঘন্টার মধ্যে পেমেন্ট করা হবে।`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`উইথড্র রিকোয়েস্ট সফল!\n${amount} টাকা ${accountNumber} নম্বরে পাঠানো হবে।`);
        }
        
    } catch (error) {
        console.log('Withdraw error:', error);
        alert('উইথড্র রিকোয়েস্ট করতে সমস্যা হয়েছে!');
    }
}

// Complete Ad Watch
async function completeAdWatch() {
    try {
        const userId = getUserId();
        const userRef = db.collection('users').doc(userId);
        const doc = await userRef.get();
        
        if (doc.exists) {
            const userData = doc.data();
            const newAds = (userData.today_ads || 0) + 1;
            const newTotalAds = (userData.total_ads || 0) + 1;
            
            await userRef.update({
                today_ads: newAds,
                total_ads: newTotalAds,
                balance: (userData.balance || 0) + 30,
                total_income: (userData.total_income || 0) + 30
            });
            
            return true;
        }
        return false;
    } catch (error) {
        console.log('Ad complete error:', error);
        return false;
    }
}

// Initialize App
async function initApp() {
    if (tg) {
        tg.expand();
        tg.ready();
    }
    
    await updateUserUI();
    
    // Navigation active state
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.bottom-nav a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('text-blue-600');
            link.classList.remove('text-gray-500');
        }
    });
}

// Start when page loads
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for HTML
window.copyReferralLink = copyReferralLink;
window.generateReferralLink = generateReferralLink;
window.checkWithdrawEligibility = checkWithdrawEligibility;
window.submitWithdrawRequest = submitWithdrawRequest;
window.completeAdWatch = completeAdWatch;
window.getReferralCount = getReferralCount;