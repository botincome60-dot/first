// app.js - Production Version with Render Backend - FIXED
console.log("🚀 App.js loading with Production Backend...");

const tg = window.Telegram?.WebApp;
const API_BASE = 'https://sohojincome-backend.onrender.com/api';

// Global user data
let userData = null;

// Initialize user data
async function initializeUserData() {
  console.log("🔄 Initializing user data with Production Backend...");
  
  try {
    // Expand Telegram Web App
    if (tg) {
      tg.expand();
      tg.ready();
      console.log("✅ Telegram Web App initialized");
    }

    // Get user ID from Telegram or create test ID - FIXED
    let userId;
    let firstName = 'ইউজার';
    let username = '';
    
    if (tg?.initDataUnsafe?.user?.id) {
      userId = tg.initDataUnsafe.user.id.toString();
      firstName = tg.initDataUnsafe.user.first_name || 'ইউজার';
      username = tg.initDataUnsafe.user.username || '';
      console.log("📱 Telegram User ID:", userId);
    } else {
      // Generate random ID for browser testing (without test_ prefix)
      userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      console.log("🖥️ Test User ID:", userId);
    }

    // Get user data from Production API
    const response = await fetch(`${API_BASE}/users/${userId}?first_name=${encodeURIComponent(firstName)}&username=${username}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch user data from server');
    }
    
    const result = await response.json();
    userData = result.data;
    console.log("✅ User data loaded from Production:", userData);
    
    // Process referral if any
    await processReferralWithStartApp();
    
    // Update UI
    updateUI();
    
    console.log("✅ User initialization complete");
    hideLoading();
    
  } catch (error) {
    console.error("❌ Error initializing user data:", error);
    fallbackUI();
    hideLoading();
  }
}

// Process referral from Telegram start parameter
async function processReferralWithStartApp() {
  if (!userData) return;
  
  try {
    let referralCode = null;
    
    if (tg?.initDataUnsafe?.start_param) {
      referralCode = tg.initDataUnsafe.start_param;
      console.log('🎯 Found referral code in start_param:', referralCode);
    }
    
    if (!referralCode) {
      const urlParams = new URLSearchParams(window.location.search);
      referralCode = urlParams.get('startapp') || urlParams.get('start');
    }
    
    if (referralCode && referralCode.startsWith('ref')) {
      const referrerUserId = referralCode.replace('ref', '');
      
      // Validate not self-referral and user doesn't already have referrer
      if (referrerUserId !== userData.userId.replace('test_', '') && !userData.referred_by) {
        console.log('🔄 Processing referral from:', referrerUserId);
        
        await createReferralRecord(referrerUserId);
        await giveReferralBonuses(referrerUserId);
      }
    }
    
  } catch (error) {
    console.error('❌ Error processing referral:', error);
  }
}

// Create referral record
async function createReferralRecord(referrerUserId) {
  try {
    const response = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: userData.userId.replace('test_', ''),
        referredBy: referrerUserId,
        newUserName: userData.first_name,
        newUserId: userData.userId.replace('test_', '')
      })
    });
    
    if (response.ok) {
      console.log('✅ Referral record created');
      
      // Update user's referred_by field
      await updateUserData({
        referred_by: referrerUserId
      });
    }
  } catch (error) {
    console.error('❌ Error creating referral record:', error);
  }
}

// Give referral bonuses
async function giveReferralBonuses(referrerUserId) {
  try {
    const response = await fetch(`${API_BASE}/referrals/bonus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newUserId: userData.userId.replace('test_', ''),
        referrerUserId: referrerUserId
      })
    });
    
    if (response.ok) {
      // Reload user data to get updated balance
      const userResponse = await fetch(`${API_BASE}/users/${userData.userId}`);
      const result = await userResponse.json();
      userData = result.data;
      updateUI();
      
      showNotification('🎉 রেফারেল বোনাস! ৫০ টাকা পেয়েছেন!', 'success');
    }
  } catch (error) {
    console.error('❌ Error giving referral bonuses:', error);
  }
}

// Update user data via API
async function updateUserData(updates) {
  if (!userData) return;
  
  try {
    const response = await fetch(`${API_BASE}/users/${userData.userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user data');
    }
    
    const result = await response.json();
    userData = result.data;
    updateUI();
    return userData;
  } catch (error) {
    console.error("❌ Error updating user data:", error);
    throw error;
  }
}

// Get user data
function getUserData() {
  return userData;
}

// Update UI with user data
function updateUI() {
  if (!userData) return;
  
  // Clean user ID for display (remove test_ prefix)
  const displayUserId = userData.userId.replace('test_', '');
  
  const elements = {
    'userName': userData.first_name,
    'profileName': userData.first_name,
    'mainBalance': userData.balance.toFixed(2) + ' টাকা',
    'withdrawBalance': userData.balance.toFixed(2) + ' টাকা',
    'todayAds': userData.today_ads + '/10',
    'adsCounter': userData.today_ads + '/10',
    'bonusAdsCount': (userData.today_bonus_ads || 0) + '/10',
    'totalReferrals': userData.total_referrals,
    'totalReferrals2': userData.total_referrals,
    'totalAds': userData.total_ads,
    'profileTotalAds': userData.total_ads,
    'totalIncome': userData.total_income.toFixed(2) + ' টাকা',
    'profileTotalIncome': userData.total_income.toFixed(2) + ' টাকা',
    'referralLink': generateReferralLink(),
    'supportReferralLink': generateReferralLink(),
    'profileUserId': displayUserId,
    'profileReferrals': userData.total_referrals
  };
  
  for (const [id, value] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }
  
  // Update progress bars if they exist
  updateProgressBars();
}

// Update progress bars
function updateProgressBars() {
  if (!userData) return;
  
  // Main ads progress bar
  const progressBar = document.getElementById('progressBar');
  if (progressBar) {
    const progress = (userData.today_ads / 10) * 100;
    progressBar.style.width = `${progress}%`;
  }
  
  // Bonus ads progress bar
  const bonusProgressBar = document.getElementById('bonusProgressBar');
  if (bonusProgressBar) {
    const bonusProgress = ((userData.today_bonus_ads || 0) / 10) * 100;
    bonusProgressBar.style.width = `${bonusProgress}%`;
  }
  
  // Ads remaining counter
  const adsRemaining = document.getElementById('adsRemaining');
  if (adsRemaining) {
    const remaining = 10 - userData.today_ads;
    adsRemaining.textContent = remaining > 0 ? remaining : 0;
  }
}

// Generate referral link - FIXED
function generateReferralLink() {
  if (!userData) return 'লোড হচ্ছে...';
  
  // Remove any "test_" prefix from user ID for referral links
  const cleanUserId = userData.userId.replace('test_', '');
  return `https://t.me/sohojincomebot?startapp=ref${cleanUserId}`;
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

// Copy referral link - FIXED
async function copyReferralLink() {
  if (!userData) {
    alert('ডেটা লোড হয়নি। রিফ্রেশ করুন।');
    return;
  }
  
  const refLink = generateReferralLink();
  
  try {
    await navigator.clipboard.writeText(refLink);
    
    showNotification(
      `✅ রেফারেল লিঙ্ক কপি হয়েছে!\n\nআপনার রেফারেল: ${userData.total_referrals} জন`, 
      'success'
    );
    
  } catch (error) {
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

// Copy support referral link
async function copySupportReferral() {
  if (!userData) {
    alert('ডেটা লোড হয়নি। রিফ্রেশ করুন।');
    return;
  }
  
  const refLink = generateReferralLink();
  
  try {
    await navigator.clipboard.writeText(refLink);
    showNotification('রেফারেল লিঙ্ক কপি করা হয়েছে!', 'success');
  } catch (error) {
    const tempInput = document.createElement('input');
    tempInput.value = refLink;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
    showNotification('রেফারেল লিঙ্ক কপি করা হয়েছে!', 'success');
  }
}

// Check if user can watch more ads
function canWatchMoreAds() {
  if (!userData) return false;
  
  const lastReset = new Date(userData.last_ad_reset || userData.join_date);
  const now = new Date();
  const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
  
  if (hoursDiff >= 1) return true;
  return userData.today_ads < 10;
}

// Check if user can watch more bonus ads
function canWatchMoreBonusAds() {
  if (!userData) return false;
  
  const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
  const now = new Date();
  const hoursDiff = (now - lastReset) / (1000 * 60 * 60);
  
  if (hoursDiff >= 1) return true;
  return (userData.today_bonus_ads || 0) < 10;
}

// Get time until next reset
function getTimeUntilNextReset() {
  if (!userData) return 'লোড হচ্ছে...';
  
  const lastReset = new Date(userData.last_ad_reset || userData.join_date);
  const now = new Date();
  const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
  const timeDiff = nextReset - now;
  
  if (timeDiff <= 0) return 'এখনই রিসেট হবে';
  
  const minutes = Math.ceil(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
  } else {
    return `${minutes} মিনিট`;
  }
}

// Get time until next bonus reset
function getTimeUntilNextBonusReset() {
  if (!userData) return 'লোড হচ্ছে...';
  
  const lastReset = new Date(userData.last_bonus_ad_reset || userData.join_date);
  const now = new Date();
  const nextReset = new Date(lastReset.getTime() + (60 * 60 * 1000));
  const timeDiff = nextReset - now;
  
  if (timeDiff <= 0) return 'এখনই রিসেট হবে';
  
  const minutes = Math.ceil(timeDiff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours} ঘন্টা ${remainingMinutes} মিনিট`;
  } else {
    return `${minutes} মিনিট`;
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 DOM loaded, initializing app with Production Backend...");
  setTimeout(initializeUserData, 1000);
});

// Export functions to global scope
window.copyReferralLink = copyReferralLink;
window.copySupportReferral = copySupportReferral;
window.getUserData = getUserData;
window.updateUserData = updateUserData;
window.canWatchMoreAds = canWatchMoreAds;
window.getTimeUntilNextReset = getTimeUntilNextReset;
window.canWatchMoreBonusAds = canWatchMoreBonusAds;
window.getTimeUntilNextBonusReset = getTimeUntilNextBonusReset;
window.generateReferralLink = generateReferralLink;
window.showNotification = showNotification;

// Watch ads page specific functions
if (typeof updateCounter !== 'undefined') {
  window.updateCounter = updateCounter;
}

if (typeof updateBonusCounter !== 'undefined') {
  window.updateBonusCounter = updateBonusCounter;
}

// Support page specific functions
if (typeof selectMethod !== 'undefined') {
  window.selectMethod = selectMethod;
}

if (typeof getMethodName !== 'undefined') {
  window.getMethodName = getMethodName;
}

// Tasks page specific functions
if (typeof completeTelegramTask !== 'undefined') {
  window.completeTelegramTask = completeTelegramTask;
}

if (typeof completeYoutubeTask !== 'undefined') {
  window.completeYoutubeTask = completeYoutubeTask;
}

if (typeof watchVideo !== 'undefined') {
  window.watchVideo = watchVideo;
}

if (typeof addTaskBonus !== 'undefined') {
  window.addTaskBonus = addTaskBonus;
}

// Profile page specific functions
if (typeof logout !== 'undefined') {
  window.logout = logout;
}