// app.js - FIXED Telegram Data Collection Version
console.log("🚀 App.js loading with Production Backend...");

const tg = window.Telegram?.WebApp;
const API_BASE = 'https://sohojincome-backend.onrender.com/api';

// Global user data
let userData = null;

// Initialize user data - COMPLETELY FIXED
async function initializeUserData() {
  console.log("🔄 Initializing user data with Production Backend...");
  
  try {
    // DEBUG: Check Telegram availability
    console.log("🔍 Telegram WebApp Available:", !!tg);
    console.log("🔍 Window Location:", window.location.href);
    console.log("🔍 Full Telegram Object:", tg);
    
    // Expand Telegram Web App
    if (tg) {
      try {
        tg.expand();
        tg.ready();
        console.log("✅ Telegram Web App initialized");
        
        // DEBUG: Check Telegram data availability
        console.log("🔍 Telegram initDataUnsafe:", tg.initDataUnsafe);
        console.log("🔍 Telegram initData:", tg.initData);
        console.log("🔍 Telegram version:", tg.version);
        console.log("🔍 Telegram platform:", tg.platform);
        
        // Check if we're in Telegram environment
        if (tg.initDataUnsafe) {
          console.log("🔍 Telegram User Object:", tg.initDataUnsafe.user);
          console.log("🔍 Telegram Start Param:", tg.initDataUnsafe.start_param);
          console.log("🔍 Telegram Query ID:", tg.initDataUnsafe.query_id);
        }
      } catch (telegramError) {
        console.error("❌ Telegram initialization error:", telegramError);
      }
    } else {
      console.log("⚠️ Telegram WebApp not detected - running in browser mode");
    }

    // Get user ID from Telegram or create test ID - IMPROVED
    let userId;
    let firstName = 'ইউজার';
    let username = '';
    let isTelegramUser = false;
    
    // Method 1: Check Telegram WebApp data
    if (tg?.initDataUnsafe?.user?.id) {
      userId = tg.initDataUnsafe.user.id.toString();
      firstName = tg.initDataUnsafe.user.first_name || 'ইউজার';
      username = tg.initDataUnsafe.user.username || '';
      isTelegramUser = true;
      console.log("📱 Telegram User ID Found:", userId);
      console.log("📱 Telegram First Name:", firstName);
      console.log("📱 Telegram Username:", username);
    } 
    // Method 2: Check URL parameters (for testing)
    else if (window.location.search.includes('tgWebAppData')) {
      console.log("🔍 Found Telegram WebApp data in URL");
      const urlParams = new URLSearchParams(window.location.search);
      const tgWebAppData = urlParams.get('tgWebAppData');
      if (tgWebAppData) {
        try {
          const decodedData = JSON.parse(decodeURIComponent(tgWebAppData));
          console.log("🔍 Decoded Telegram Data:", decodedData);
          if (decodedData.user) {
            userId = decodedData.user.id.toString();
            firstName = decodedData.user.first_name || 'ইউজার';
            username = decodedData.user.username || '';
            isTelegramUser = true;
          }
        } catch (e) {
          console.error("❌ Error parsing Telegram data:", e);
        }
      }
    }
    // Method 3: Generate test ID
    else {
      userId = Math.floor(1000000000 + Math.random() * 9000000000).toString();
      console.log("🖥️ No Telegram ID - Using Test ID:", userId);
    }

    console.log("🔍 Final User ID to use:", userId);
    console.log("🔍 Is Telegram User:", isTelegramUser);
    
    if (!userId) {
      throw new Error("No user ID available");
    }

    // Get user data from Production API
    const apiUrl = `${API_BASE}/users/${userId}?first_name=${encodeURIComponent(firstName)}&username=${username}&is_telegram=${isTelegramUser}`;
    console.log("🔍 API URL:", apiUrl);

    const response = await fetch(apiUrl);
    
    console.log("🔍 API Response Status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ API Error Response:", errorText);
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    
    const result = await response.json();
    console.log("🔍 API Success Response:", result);
    
    if (!result.success) {
      throw new Error(`API returned error: ${result.error}`);
    }
    
    userData = result.data;
    console.log("✅ User data loaded from Production:", userData);
    
    // Process referral if any
    await processReferralWithStartApp();
    
    // Force UI update with delay to ensure DOM is ready
    setTimeout(() => {
      updateUI();
      console.log("🎯 UI Update completed after delay");
    }, 500);
    
    console.log("✅ User initialization complete");
    hideLoading();
    
  } catch (error) {
    console.error("❌ Error initializing user data:", error);
    console.error("❌ Error stack:", error.stack);
    
    // Show error to user
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.showPopup({
        title: 'Error',
        message: 'Failed to load user data. Please try again.',
        buttons: [{ type: 'close' }]
      });
    }
    
    fallbackUI();
    hideLoading();
  }
}

// Process referral from Telegram start parameter - IMPROVED
async function processReferralWithStartApp() {
  if (!userData) return;
  
  try {
    let referralCode = null;
    
    // Method 1: Check Telegram start_param
    if (tg?.initDataUnsafe?.start_param) {
      referralCode = tg.initDataUnsafe.start_param;
      console.log('🎯 Found referral code in start_param:', referralCode);
    }
    
    // Method 2: Check URL parameters
    if (!referralCode) {
      const urlParams = new URLSearchParams(window.location.search);
      referralCode = urlParams.get('startapp') || urlParams.get('start') || urlParams.get('ref');
      if (referralCode) {
        console.log('🎯 Found referral code in URL:', referralCode);
      }
    }
    
    // Method 3: Check Telegram initData
    if (!referralCode && tg?.initData) {
      try {
        const initData = new URLSearchParams(tg.initData);
        referralCode = initData.get('start_param');
        if (referralCode) {
          console.log('🎯 Found referral code in initData:', referralCode);
        }
      } catch (e) {
        console.error('❌ Error parsing initData:', e);
      }
    }
    
    if (referralCode && referralCode.startsWith('ref')) {
      const referrerUserId = referralCode.replace('ref', '');
      const cleanUserId = userData.userId.replace('test_', '');
      
      console.log('🔄 Processing referral:', {
        referralCode,
        referrerUserId,
        currentUserId: cleanUserId,
        hasReferrer: !!userData.referred_by
      });
      
      // Validate not self-referral and user doesn't already have referrer
      if (referrerUserId !== cleanUserId && !userData.referred_by) {
        console.log('✅ Valid referral - processing...');
        
        await createReferralRecord(referrerUserId);
        await giveReferralBonuses(referrerUserId);
      } else {
        console.log('⚠️ Invalid referral - skipping');
      }
    } else {
      console.log('ℹ️ No referral code found');
    }
    
  } catch (error) {
    console.error('❌ Error processing referral:', error);
  }
}

// Create referral record
async function createReferralRecord(referrerUserId) {
  try {
    const cleanUserId = userData.userId.replace('test_', '');
    
    const response = await fetch(`${API_BASE}/referrals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: cleanUserId,
        referredBy: referrerUserId,
        newUserName: userData.first_name,
        newUserId: cleanUserId
      })
    });
    
    if (response.ok) {
      console.log('✅ Referral record created');
      
      // Update user's referred_by field
      await updateUserData({
        referred_by: referrerUserId
      });
    } else {
      const errorText = await response.text();
      console.error('❌ Referral creation failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Error creating referral record:', error);
  }
}

// Give referral bonuses
async function giveReferralBonuses(referrerUserId) {
  try {
    const cleanUserId = userData.userId.replace('test_', '');
    
    const response = await fetch(`${API_BASE}/referrals/bonus`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        newUserId: cleanUserId,
        referrerUserId: referrerUserId
      })
    });
    
    if (response.ok) {
      console.log('✅ Referral bonuses processed');
      
      // Reload user data to get updated balance
      await reloadUserData();
      
      showNotification('🎉 রেফারেল বোনাস! ৫০ টাকা পেয়েছেন!', 'success');
    } else {
      const errorText = await response.text();
      console.error('❌ Referral bonus failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Error giving referral bonuses:', error);
  }
}

// Update user data via API
async function updateUserData(updates) {
  if (!userData) return;
  
  try {
    console.log("🔄 Updating user data:", updates);
    
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
    
    // Force UI update
    updateUI();
    
    return userData;
  } catch (error) {
    console.error("❌ Error updating user data:", error);
    throw error;
  }
}

// Reload user data from server
async function reloadUserData() {
  if (!userData) return;
  
  try {
    console.log("🔄 Reloading user data from server...");
    
    const response = await fetch(`${API_BASE}/users/${userData.userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to reload user data');
    }
    
    const result = await response.json();
    userData = result.data;
    console.log("✅ User data reloaded:", userData);
    
    updateUI();
    return userData;
  } catch (error) {
    console.error("❌ Error reloading user data:", error);
  }
}

// Get user data
function getUserData() {
  return userData;
}

// Update UI with user data - IMPROVED
function updateUI() {
  if (!userData) {
    console.log("❌ No user data available for UI update");
    return;
  }
  
  console.log("🔄 Updating UI with user data:", userData);
  
  // Clean user ID for display
  const displayUserId = userData.userId ? userData.userId.replace('test_', '') : '০';
  
  const elements = {
    'userName': userData.first_name || 'ইউজার',
    'profileName': userData.first_name || 'ইউজার',
    'mainBalance': (userData.balance || 0).toFixed(2) + ' টাকা',
    'withdrawBalance': (userData.balance || 0).toFixed(2) + ' টাকা',
    'todayAds': (userData.today_ads || 0) + '/10',
    'adsCounter': (userData.today_ads || 0) + '/10',
    'bonusAdsCount': (userData.today_bonus_ads || 0) + '/10',
    'totalReferrals': userData.total_referrals || 0,
    'totalReferrals2': userData.total_referrals || 0,
    'totalAds': userData.total_ads || 0,
    'profileTotalAds': userData.total_ads || 0,
    'totalIncome': (userData.total_income || 0).toFixed(2) + ' টাকা',
    'profileTotalIncome': (userData.total_income || 0).toFixed(2) + ' টাকা',
    'referralLink': generateReferralLink(),
    'supportReferralLink': generateReferralLink(),
    'profileUserId': displayUserId,
    'profileReferrals': userData.total_referrals || 0
  };
  
  console.log("📝 Elements to update:", elements);
  
  let updatedCount = 0;
  for (const [id, value] of Object.entries(elements)) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
      updatedCount++;
    }
  }
  
  console.log(`✅ UI Update Complete: ${updatedCount} elements updated`);
  
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
}

// Generate referral link
function generateReferralLink() {
  if (!userData) return 'লোড হচ্ছে...';
  
  // Clean user ID for referral links
  const cleanUserId = userData.userId.replace('test_', '');
  return `https://t.me/sohojincomebot?startapp=ref${cleanUserId}`;
}

// Fallback UI
function fallbackUI() {
  console.log("🔄 Loading fallback UI...");
  
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
  if (overlay) {
    overlay.style.display = 'none';
    console.log("✅ Loading overlay hidden");
  }
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

// Debug function
function debugApp() {
  console.log("=== 🐛 DEBUG APP STATE ===");
  console.log("User Data:", userData);
  console.log("Telegram Available:", !!tg);
  console.log("API Base:", API_BASE);
  console.log("Window Location:", window.location.href);
  console.log("=== 🐛 END DEBUG ===");
  
  if (userData) {
    reloadUserData();
  } else {
    initializeUserData();
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 DOM loaded, initializing app...");
  console.log("🔍 User Agent:", navigator.userAgent);
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
window.generateReferralLink = generateReferralLink;
window.showNotification = showNotification;
window.debugApp = debugApp;
window.reloadUserData = reloadUserData;