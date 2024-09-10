const express = require('express');
const router = express.Router();
const fs = require('fs');
const app = express();
const axios = require('axios');
const cheerio = require('cheerio');
const noblox = require('noblox.js');
const socketService = require('../utils/socketService');
const wait = require('wait');
const { channel } = require('diagnostics_channel');
const currentDate = new Date();
const crypto = require('crypto');
const res = require('express/lib/response');
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
  canUseDailyCommand 
} = require('../utils/dbChange');
const { info, error } = require('console');

// Function to obtain CSRF token
async function getGeneralToken(cookie) {
  const httpOpt = {
    url: 'https://auth.roblox.com/v2/logout',
    method: 'POST',
    headers: {
      'Cookie': `.ROBLOSECURITY=${cookie}`
    }
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
    'Cookie': `.ROBLOSECURITY=${robloSecurityCookie}`  // This should be valid!
  };

  const data = {
    'expectedCurrency': 1,
    'expectedPrice': expectedPrice,
    'expectedSellerId': expectedSeller
  };

  console.log('Attempting purchase with the following details:');
  console.log('CSRF Token:', csrfToken);
  console.log('Product ID:', productId);
  console.log('Expected Price:', expectedPrice);
  console.log('Expected Seller:', expectedSeller);

  try {
    const response = await axios.post(url, data, { headers: headers });

    if (response.data && response.data.purchased === true) {
      console.log('Purchase successful:', response.data);
      return true;
    } else {
      console.log('Purchase response:', response.data);
      throw new Error('Purchase failed for unknown reasons');
    }
  } catch (error) {
    console.error('Error making purchase:', error.response?.data || error.message);
    return false;
  }
}

router.post('/login', async (req, res) => {
  const userID = req.headers.authorization;
  const userName = req.headers.username;
  if (userID) {
    const userData = await checkUserExists(userID);
    if (userData === null) {
      const sessionToken = `${userID}`;
      await addnewUser(userName, userID, sessionToken);
      res.json({
        sessionToken: sessionToken
      });
    } else {
      const sessionToken = `${userID}`;
      res.json({
        sessionToken: sessionToken
      });
    }
  } else {
    res.status(401).json({ error: 'Token or username not provided' });
  }
});

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

router.post('/user', async (req, res) => {
  const username = req.headers.authorization || req.query.username;
  if (username) {
    try {
      const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
        "usernames": [username],
        "excludeBannedUsers": true
      });

      if (response.status === 200) {
        const userData = response.data.data[0];
        const imageData = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userData.id}&size=48x48&format=Png&isCircular=false`);
        res.json({
          username: userData.displayName,
          id: userData.id,
          avatarUrl: `${imageData.data.data[0].imageUrl}`,
        });
      } else {
        res.status(response.status).json({ error: `Unable to retrieve user information. Status code: ${response.status}` });
      }
    } catch (error) {
      res.status(500).json({ error: `An error occurred: ${error.message}` });
    }
  } else {
    res.status(401).json({ error: 'Token or username not provided' });
  }
});

router.post('/withdraw', async (req, res) => {
  const userID = req.headers.authorization;
  const gpID = req.query.gpID;
  const gpAm = Math.round(req.query.withAmount / 0.70);
  const withAm = Math.round(req.query.withAmount * 1);

  if (!userID) {
    return res.status(401).json({ error: 'Token or username not provided' });
  }

  console.log('Checking user:', userID);

  const userData = await checkUserExists(userID);
  if (!userData) {
    console.log("User not found.");
    return res.redirect('/login');
  }

  if (withAm > userData.balance) {
    console.log("Not enough balance.");
    return res.status(400).json({ error: 'Not enough balance' });
  }

  // Check if the user has completed a survey before withdrawing
  let validSurvey = await canUseDailyCommand(userID);
  if (!validSurvey) {
    return res.status(400).json({ error: 'Must complete a survey before withdraw' });
  }

  try {
    const response = await axios.get(`https://apis.roblox.com/game-passes/v1/game-passes/${gpID}/product-info`);
    const gpData = response.data;

    if (parseInt(gpData.Creator.Id) !== parseInt(userID)) {
      return res.status(403).json({ error: 'Unauthorized: Incorrect seller ID' });
    }

    if (parseInt(gpData.PriceInRobux) !== parseInt(gpAm)) {
      return res.status(400).json({ error: 'Price mismatch' });
    }

    // Deduct the balance before attempting to buy
    const newBalance = userData.balance - withAm;
    await changeUserBalance(userID, newBalance);

    // Now, attempt to purchase the game pass
    const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_YOUR_ROBLOSECURITY_COOKIE_HERE';
    const purchaseSuccess = await makePurchase(gpData.ProductId, cookies, gpAm, gpData.Creator.Id);

    if (!purchaseSuccess) {
      throw new Error('Failed to purchase the gamepass. Transaction aborted.');
    }

    console.log('Withdrawal completed');
    res.status(200).json({ message: 'Transaction completed' });
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
    res.status(400).json({ error: 'Failed to buy gamepass: ' + error.message });
  }
});

module.exports = router;


