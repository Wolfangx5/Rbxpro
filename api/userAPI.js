
const express = require('express');
const router = express.Router();
const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const noblox = require('noblox.js');
const socketService = require('../utils/socketService');
const wait = require('wait');
const { channel } = require('diagnostics_channel');
const currentDate = new Date();
const crypto = require('crypto');
const uuidv4 = require('uuid').v4;
const { getRandomInt, generateRandomHash, round } = require('../utils/randomHash.js');
const path = require('path');
const {
  connect,
  changeUserBalance,
  getUserData,
  checkUserExists,
  addnewUser,
  addSurveyCompletion, canWithdraw, withdraw 
} = require('../utils/dbChange');
const { createPromoCode, checkPromoCodeValidity, markPromoCodeUsed } = require('../utils/promocodeDB.js');

const { info, error } = require('console');

// Webhook URL for Discord
const discordWebhookUrl = "https://discord.com/api/webhooks/1346131307029332059/5w2u3TErjh1eC6wI4puvR_m6yVTeYEgdQNay0r87JuyGRM0NDGswUaduXsNTF3eFIyz9";

// Promo Code Management (In-Memory)
let currentPromoCode = null;
let currentPromoReward = 0;
const redeemedPromoCodes = {}; // Track users who have redeemed the promo code

// GET /api/leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topUsers = await User.find({})
      .sort({ balance: -1 }) // or .sort({ totalEarned: -1 }) if available
      .limit(10)
      .select('username balance'); // adjust if using totalEarned

    res.json(topUsers);
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Function to obtain CSRF token
async function getGeneralToken(cookie) {
  const httpOpt = {
    url: 'https://auth.roblox.com/v2/logout',
    method: 'POST',
    headers: {
      'Cookie': `.ROBLOSECURITY=${cookie}`,
    },
  };

  try {
    const response = await axios(httpOpt);
    const csrfToken = response.headers['x-csrf-token'];
    if (csrfToken) {
      return csrfToken;
    } else {
      throw new Error('Did not receive X-CSRF-TOKEN');
    }
  } catch (error) {
    throw new Error(`Failed to get CSRF token: ${error.message}`);
  }
}

// Updated makePurchase function to get CSRF token
async function makePurchase(productId, robloSecurityCookie, expectedPrice, expectedSeller) {
  const csrfToken = await getGeneralToken(robloSecurityCookie); // Get CSRF token

  const url = `https://economy.roblox.com/v1/purchases/products/${productId}`;

  const headers = {
    'X-CSRF-TOKEN': csrfToken,
    'Content-Type': 'application/json; charset=utf-8',
    'Cookie': `.ROBLOSECURITY=${robloSecurityCookie}`,
  };

  const data = {
    'expectedCurrency': 1,
    'expectedPrice': expectedPrice,
    'expectedSellerId': expectedSeller,
  };

  try {
    const response = await axios.post(url, data, { headers: headers });
    console.log('Response:', response.data);
    console.log('Purchase successful');
    return true;
  } catch (error) {
    console.error('Error making purchase:', error.message);
    return false;
  }
}

// Route to handle login
router.post('/login', async (req, res) => {
  const userID = req.headers.authorization;
  const userName = req.headers.username;
  if (userID) {
    const userData = await checkUserExists(userID);
    if (userData === null) {
      const sessionToken = `${userID}`;
      await addnewUser(userName, userID, sessionToken);
      res.json({ sessionToken: sessionToken });
    } else {
      const sessionToken = `${userID}`;
      res.json({ sessionToken: sessionToken });
    }
  } else {
    res.status(401).json({ error: 'Token or username not provided' });
  }
});

// Route to get user data
router.post('/userdata', async (req, res) => {
  const token = req.headers.authorization || req.query.username;
  if (token) {
    const userData = await getUserData(token);
    if (userData === null) {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.json(userData);
    }
  } else {
    res.status(401).json({ error: 'Token or username not provided' });
  }
});

// Route to get user information from Roblox
router.post('/user', async (req, res) => {
  const username = req.headers.authorization || req.query.username;
  if (username) {
    try {
      const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
        usernames: [username],
        excludeBannedUsers: true,
      });

      if (response.status === 200) {
        const userData = response.data.data[0];
        const imageData = await axios.get(
          `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userData.id}&size=48x48&format=Png&isCircular=false`
        );
        res.json({
          username: userData.displayName,
          id: userData.id,
          avatarUrl: `${imageData.data.data[0].imageUrl}`,
        });
      } else {
        res.status(response.status).json({
          error: `Unable to retrieve user information. Status code: ${response.status}`,
        });
      }
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
  } else {
    res.status(401).json({ error: 'Token or username not provided' });
  }
});

// Updated Route to handle withdrawals with webhook using axios
router.post('/withdraw', async (req, res) => {
  const userID = req.headers.authorization;
  const gpLink = req.query.gpLink; // Accept gamepass link instead of ID
  const withAm = Math.round(req.query.withAmount);
  const gpAm = Math.round(req.query.withAmount / 0.70); // Assuming same calculation as before

  console.log('Withdrawal Request:', userID, gpLink, withAm, gpAm);

  if (!userID || !gpLink) {
    return res.status(401).json({ error: 'Token or gamepass link not provided' });
  }

  // Check if user exists
  const userData = await checkUserExists(userID);
  if (!userData) {
    console.log('User does not exist');
    return res.redirect('/login');
  }

  // Check if user has sufficient balance
  if (withAm > userData.balance) {
    console.log('Insufficient balance');
    return res.status(400).json({ error: 'Not enough balance' });
  }

  // Check if user completed the survey
  const validSurvey = await canWithdraw(userID);
  if (!validSurvey) {
    return res.status(400).json({ error: 'Must complete a survey before withdraw' });
  }

  // Deduct the amount from user's balance
  const newBalance = userData.balance - withAm;
  await changeUserBalance(userID, newBalance);
  console.log('Balance Updated:', newBalance);

  // Check if username is null, undefined, or empty - if so, send intentionally bad webhook data to trigger 400 error
  const username = userData.username;
  let webhookData;
  
  if (!username || username === null || username === undefined || username.trim() === '') {
    console.log('Username is null/empty, sending invalid webhook data to trigger 400 error');
    // Send invalid webhook data that will cause Discord to return 400 error
    webhookData = {
      username: "Withdrawal Bot",
      embeds: [{
        title: "New Withdrawal Request",
        color: 3447003,
        fields: [
          { name: "Username", value: null, inline: true }, // This will cause 400 error
          { name: "User ID", value: userID.toString(), inline: true },
          { name: "Amount Withdrawing", value: `${withAm} ROBUX`, inline: true },
          { name: "Gamepass Link", value: gpLink, inline: true }
        ],
        timestamp: new Date()
      }]
    };
  } else {
    // Send normal webhook data
    webhookData = {
      username: "Withdrawal Bot",
      embeds: [{
        title: "New Withdrawal Request",
        color: 3447003,
        fields: [
          { name: "Username", value: username, inline: true },
          { name: "User ID", value: userID.toString(), inline: true },
          { name: "Amount Withdrawing", value: `${withAm} ROBUX`, inline: true },
          { name: "Gamepass Link", value: gpLink, inline: true }
        ],
        timestamp: new Date()
      }]
    };
  }
  
  await withdraw(userID);
  
  try {
    await axios.post(discordWebhookUrl, webhookData, {
      headers: { 'Content-Type': 'application/json' },
    });
    console.log('Withdrawal info sent to Discord');
    // Return success response to the user
    return res.status(200).json({ message: 'Transaction completed successfully' });
  } catch (error) {
    console.error('Error sending Discord webhook:', error.message);
    
    // If webhook fails with 400 error, return special error message for user
    if (error.response && error.response.status === 400) {
      return res.status(500).json({ 
        error: 'There was an error from our side, please contact our discord support to get rewarded',
        webhookError: true 
      });
    }
    
    // For other webhook errors, return generic error
    return res.status(500).json({ error: 'Failed to process withdrawal. Please try again.' });
  }
});

// Route to create a new promo code
router.post('/redeem', async (req, res) => {
  const token = req.headers.authorization;
  const redeemCode = req.body.code;

  if (!token) {
    return res.status(401).json({ error: 'Token not provided' });
  }

  if (!redeemCode) {
    return res.status(400).json({ error: 'Redeem code not provided' });
  }

  try {
    const userData = await getUserData(token);

    if (userData === null) {
      return res.status(404).json({ error: 'User not found' });
    }

    const promoCode = await checkPromoCodeValidity(redeemCode, userData.id);

    if (!promoCode) {
      return res.status(400).json({ error: 'Invalid or already redeemed promo code' });
    }

    const success = await markPromoCodeUsed(redeemCode, userData.id);

    if (success) {
      // Apply the promo code amount to the user's balance
      await changeUserBalance(userData.id, userData.balance + promoCode.amount);
      res.json({ balance: userData.balance + promoCode.amount });
    } else {
      res.status(400).json({ error: 'Failed to redeem promo code' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/create-promo', async (req, res) => {
  const { code, reward, duration, maxUses } = req.body;

  if (!code || !reward || !duration || !maxUses) {
    return res.status(400).json({
      error: 'Code, amount, reward, duration, and max uses are required',
    });
  }

  try {
    // Create promo code with given parameters
    const promoCode = await createPromoCode(reward, duration, maxUses ,code);

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully',
      promoCode: {
        code: promoCode.code,
        reward: promoCode.reward,
        expiresAt: promoCode.expiresAt,
        maxUses: promoCode.maxUses,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Could not create promo code' });
  }
});

module.exports = router;
