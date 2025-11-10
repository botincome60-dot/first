const { Telegraf } = require('telegraf');

// Firebase Admin Setup
const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json'); // Firebase service account key

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const bot = new Telegraf('7012328491:AAEcuFK6W6EnfcU2RXtslr_A_yKHcRh9A38');

// Referral Tracking
bot.start(async (ctx) => {
    const message = ctx.message.text;
    const newUserId = ctx.from.id;
    const newUserName = ctx.from.first_name;

    console.log(`New user: ${newUserName} (${newUserId})`);

    // Check for referral code
    if (message.includes(' ')) {
        const refCode = message.split(' ')[1];
        
        if (refCode && refCode.startsWith('ref')) {
            const referrerId = refCode.replace('ref', '');
            
            console.log(`Referral detected: ${referrerId} -> ${newUserName}`);

            try {
                // Track referral in Firebase
                await trackReferral(referrerId, newUserId, newUserName);
                
                // Add bonus to referrer
                await addReferralBonus(referrerId, 100);
                
                console.log(`✅ Referral successful: ${referrerId} got new referral from ${newUserName}`);
                
            } catch (error) {
                console.log('Referral tracking error:', error);
            }
        }
    }

    // Send welcome message with app button
    ctx.reply(`🎉 Welcome ${newUserName}! Earn money with simple tasks.`, {
        reply_markup: {
            keyboard: [[{
                text: "💰 ইনকাম শুরু করুন",
                web_app: { url: "https://first-omega-dun.vercel.app/" }
            }]],
            resize_keyboard: true
        }
    });
});

// Firebase Functions
async function trackReferral(referrerId, newUserId, newUserName) {
    const referrerRef = db.collection('referrals').doc(referrerId);
    const doc = await referrerRef.get();
    
    let updatedCount = 1;
    let updatedUsers = [newUserId.toString()];
    
    if (doc.exists) {
        const data = doc.data();
        updatedCount = (data.count || 0) + 1;
        updatedUsers = [...(data.referredUsers || []), newUserId.toString()];
    }
    
    await referrerRef.set({
        count: updatedCount,
        referredUsers: updatedUsers,
        referrerName: newUserName,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return updatedCount;
}

async function addReferralBonus(userId, amount) {
    const userRef = db.collection('users').doc(userId);
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
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
}

bot.launch();
console.log('🤖 Bot started with referral tracking');