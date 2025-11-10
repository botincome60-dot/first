// Telegram Web App initialization
const tg = window.Telegram.WebApp;

// Firebase Configuration - YOUR CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyABdp9WK7eGLwE5nY19jp-nlDlyTuTyMR0",
  authDomain: "sohojincome-36f1f.firebaseapp.com",
  projectId: "sohojincome-36f1f",
  storageBucket: "sohojincome-36f1f.firebasestorage.app",
  messagingSenderId: "398153090805",
  appId: "1:398153090805:web:fc8d68130afbc2239be7bc",
  measurementId: "G-VZ47961SJV"
};

// Firebase initialize
let db;
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.log('Firebase initialization error:', error);
}

// Initialize the app
function initTelegramApp() {
    if (tg) {
        tg.expand();
        tg.ready();
        
        console.log('Telegram Web App initialized');
        console.log('User data:', tg.initDataUnsafe?.user);
        
        // Initialize user data if not exists
        initializeUserData();
    } else {
        console.log('Telegram Web App not detected, running in standalone mode');
        initializeUserData();
    }
}

// User data management
function initializeUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
        // Create new user data from Telegram
        const telegramUser = tg?.initDataUnsafe?.user;
        const newUser = {
            id: telegramUser?.id || Math.floor(100000 + Math.random() * 900000),
            first_name: telegramUser?.first_name || 'ইউজার',
            username: telegramUser?.username || '',
            balance: 0.00,
            today_ads: 0,
            total_ads: 0,
            total_referrals: 0,
            total_income: 0.00,
            join_date: new Date().toISOString()
        };
        
        localStorage.setItem('telegramUserData', JSON.stringify(newUser));
        console.log('New user data created:', newUser);
    }
}

// Get user data
function getUserData() {
    let userData = localStorage.getItem('telegramUserData');
    
    if (!userData) {
        // If no data in localStorage, get from Telegram
        const telegramUser = tg?.initDataUnsafe?.user;
        if (telegramUser) {
            userData = {
                id: telegramUser.id,
                first_name: telegramUser.first_name || 'ইউজার',
                username: telegramUser.username || '',
                balance: 0.00,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 0.00,
                join_date: new Date().toISOString()
            };
            localStorage.setItem('telegramUserData', JSON.stringify(userData));
        } else {
            // Fallback data
            userData = {
                id: Math.floor(100000 + Math.random() * 900000),
                first_name: 'ইউজার',
                username: '',
                balance: 0.00,
                today_ads: 0,
                total_ads: 0,
                total_referrals: 0,
                total_income: 0.00,
                join_date: new Date().toISOString()
            };
        }
    }
    
    return typeof userData === 'string' ? JSON.parse(userData) : userData;
}

// Update user data
function updateUserData(updates) {
    const userData = getUserData();
    const updatedData = { ...userData, ...updates };
    localStorage.setItem('telegramUserData', JSON.stringify(updatedData));
    return updatedData;
}

// Firebase referral functions
async function trackReferral(referrerId, newUserId, newUserName) {
    try {
        if (!db) {
            console.log('Firebase not initialized');
            return false;
        }

        const referrerRef = db.collection('referrals').doc(referrerId.toString());
        const doc = await referrerRef.get();
        
        if (doc.exists) {
            // Existing user - update count
            const data = doc.data();
            const updatedCount = (data.count || 0) + 1;
            const updatedUsers = [...(data.referredUsers || []), newUserId.toString()];
            
            await referrerRef.update({
                count: updatedCount,
                referredUsers: updatedUsers,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`Referral updated: ${referrerId} now has ${updatedCount} referrals`);
        } else {
            // New user - create document
            await referrerRef.set({
                count: 1,
                referredUsers: [newUserId.toString()],
                referrerName: newUserName || 'Unknown',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            console.log(`New referral created: ${referrerId} has 1 referral`);
        }
        
        return true;
    } catch (error) {
        console.error('Error tracking referral:', error);
        return false;
    }
}

async function getReferralCount(userId) {
    try {
        if (!db) {
            console.log('Firebase not initialized');
            return 0;
        }

        const doc = await db.collection('referrals').doc(userId.toString()).get();
        
        if (doc.exists) {
            return doc.data().count || 0;
        } else {
            return 0;
        }
    } catch (error) {
        console.error('Error getting referral count:', error);
        return 0;
    }
}

async function updateReferralDisplay() {
    try {
        const user = getUserData();
        const count = await getReferralCount(user.id);
        
        // Update all referral count elements
        document.querySelectorAll('[id*="Referral"], [id*="referral"]').forEach(element => {
            if (element.id.includes('Referral') || element.id.includes('referral')) {
                element.textContent = count;
            }
        });
        
        // Update specific elements
        if (document.getElementById('totalReferrals')) {
            document.getElementById('totalReferrals').textContent = count;
        }
        if (document.getElementById('userReferrals')) {
            document.getElementById('userReferrals').textContent = count;
        }
        if (document.getElementById('profileReferrals')) {
            document.getElementById('profileReferrals').textContent = count;
        }
        
        // Update user data
        updateUserData({ total_referrals: count });
        
        return count;
    } catch (error) {
        console.error('Error updating referral display:', error);
        return 0;
    }
}

// Format currency
function formatCurrency(amount) {
    return amount.toFixed(2) + ' টাকা';
}

// Show notification
function showNotification(message, type = 'info') {
    if (tg && tg.showPopup) {
        tg.showPopup({
            title: type === 'success' ? 'সফল!' : 
                   type === 'error' ? 'ত্রুটি!' : 'মেসেজ',
            message: message,
            buttons: [{ type: 'close' }]
        });
    } else {
        alert(message);
    }
}

// Generate referral link
function generateReferralLink() {
    const user = getUserData();
    const botUsername = 'sohojincomebot';
    return `https://t.me/${botUsername}?start=ref${user.id}`;
}

// Copy referral link function
async function copyReferralLink() {
    const refLink = generateReferralLink();
    
    try {
        await navigator.clipboard.writeText(refLink);
        
        // Firebase-এ track করুন (optional)
        const user = getUserData();
        if (db) {
            await db.collection('linkCopies').doc(user.id.toString()).set({
                copiedAt: firebase.firestore.FieldValue.serverTimestamp(),
                userAgent: navigator.userAgent
            }, { merge: true });
        }
        
        const refCount = await getReferralCount(user.id);
        
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.showPopup({
                title: "✅ কপি হয়েছে!",
                message: `রেফারেল লিঙ্ক কপি করা হয়েছে!\n\nআপনার রেফারেল: ${refCount} জন`,
                buttons: [{ type: "close" }]
            });
        } else {
            alert(`রেফারেল লিঙ্ক কপি হয়েছে!\nআপনার রেফারেল: ${refCount} জন`);
        }
        
    } catch (error) {
        console.error('Copy failed:', error);
        alert('লিঙ্ক কপি করতে সমস্যা হয়েছে!');
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initTelegramApp();
    
    // Update referral count on page load
    setTimeout(() => {
        updateReferralDisplay();
    }, 1000);
    
    // Update active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.bottom-nav a');
    
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage) {
            link.classList.add('text-blue-600');
            link.classList.remove('text-gray-500');
        }
    });
});

// Handle back button
if (tg && tg.BackButton) {
    tg.BackButton.show();
    tg.BackButton.onClick(function() {
        window.history.back();
    });
}

// Export functions for global access
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.showNotification = showNotification;
window.formatCurrency = formatCurrency;
window.generateReferralLink = generateReferralLink;
window.copyReferralLink = copyReferralLink;
window.getReferralCount = getReferralCount;
window.updateReferralDisplay = updateReferralDisplay;
window.trackReferral = trackReferral;