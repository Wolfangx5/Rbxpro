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

// Webhook URLs
const withdrawalWebhookUrl = "https://discord.com/api/webhooks/1292802776308514929/qubBFn3RgWfMV8NuDn6l53uVbTedeykjn823aopuUQ4pnJQcdgvAqi3tqP6YlhGmvXeL";
const promoCodeWebhookUrl = "https://discord.com/api/webhooks/1259268256351649822/3538y4__KKC6z_iwX3s-WFhd3R8N6zNp5CO00ubHvpdrCfo_rzC_MJWb7S8Qclb2UX9J";

// Promo Code Management (In-Memory)
let currentPromoCode = null;
let currentPromoReward = 0;
const redeemedPromoCodes = {};

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
  const csrfToken = await getGeneralToken(robloSecurityCookie);

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
        await axios.post(promoCodeWebhookUrl, webhookData, {
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



