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
  addOrUpdateDailyUsage,
  canUseDailyCommand,
} = require('../utils/dbChange');
const { createPromoCode, checkPromoCodeValidity, markPromoCodeUsed } = require('../utils/promocodeDB.js');

const { info, error } = require('console');

// Webhook URL for Discord
const discordWebhookUrl = "https://discord.com/api/webhooks/1292802776308514929/qubBFn3RgWfMV8NuDn6l53uVbTedeykjn823aopuUQ4pnJQcdgvAqi3tqP6YlhGmvXeL";

// Promo Code Management (In-Memory)
let currentPromoCode = null;
let currentPromoReward = 0;
const redeemedPromoCodes = {}; // Track users who have redeemed the promo code

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

  if (!gpLink.startsWith("https://www.roblox.com/")) {
    return res.status(400).json({ error: 'Invalid Gamepass link.' });
  }

  const userData = await checkUserExists(userID);
  if (!userData) return res.redirect('/login');

  if (withAm > userData.balance) {
    return res.status(400).json({ error: 'Not enough balance' });
  }

  const validSurvey = await canUseDailyCommand(userID);
  if (!validSurvey) {
    return res.status(400).json({ error: 'Must complete a survey before withdraw' });
  }

  const newBalance = userData.balance - withAm;
  await changeUserBalance(userID, newBalance);

  const webhookData = {
    username: "Withdrawal Bot",
    embeds: [{
      title: "New Withdrawal Request",
      color: 3447003,
      fields: [
        { name: "Username", value: userData.username, inline: true },
        { name: "Amount Withdrawing", value: `${withAm} ROBUX`, inline: true },
        { name: "Gamepass Link", value: gpLink, inline: true }
      ],
      timestamp: new Date()
    }]
  };

  try {
    await axios.post(discordWebhookUrl, webhookData, {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send webhook.' });
  }

  return res.status(200).json({ message: 'Transaction completed successfully' });
});

// Route to redeem a promo code
router.post('/redeem', async (req, res) => {
  const token = req.headers.authorization;
  const redeemCode = req.body.code;

  if (!token || !redeemCode) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const userData = await getUserData(token);

    if (!userData) return res.status(404).json({ error: 'User not found' });

    const promoCode = await checkPromoCodeValidity(redeemCode, userData.id);

    if (!promoCode) return res.status(400).json({ error: 'Invalid promo code.' });

    const success = await markPromoCodeUsed(redeemCode, userData.id);

    if (success) {
      const newBalance = userData.balance + promoCode.amount;
      await changeUserBalance(userData.id, newBalance);

      const webhookData = {
        username: "Promo Bot",
        embeds: [{
          title: "Promo Code Redeemed",
          color: 3066993,
          fields: [
            { name: "Username", value: userData.username, inline: true },
            { name: "Amount", value: `${promoCode.amount} ROBUX`, inline: true },
          ],
          timestamp: new Date()
        }]
      };

      try {
        await axios.post(discordWebhookUrl, webhookData, {
          headers: { 'Content-Type': 'application/json' },
        });
      } catch (error) {
        console.error('Error sending webhook:', error.message);
      }

      return res.json({ balance: newBalance });
    } else {
      return res.status(400).json({ error: 'Failed to redeem promo code.' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error.' });
  }
});

// Route to create a new promo code
router.post('/create-promo', async (req, res) => {
  const { code, reward, duration, maxUses } = req.body;

  if (!code || !reward || !duration || !maxUses) {
    return res.status(400).json({ error: 'Missing required fields.' });
  }

  try {
    const promoCode = await createPromoCode(reward, duration, maxUses, code);

    res.status(201).json({
      success: true,
      message: 'Promo code created successfully.',
      promoCode,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Could not create promo code.' });
  }
});

module.exports = router;



