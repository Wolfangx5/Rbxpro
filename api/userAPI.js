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
  canUseDailyCommand,
} = require('../utils/dbChange');
const { info, error } = require('console');

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
    const response = await axios.post(url, data, {
      headers: headers,
    });

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
      res.json({
        sessionToken: sessionToken,
      });
    } else {
      const sessionToken = `${userID}`;
      res.json({
        sessionToken: sessionToken,
      });
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

// Route to handle withdrawals
router.post('/withdraw', async (req, res) => {
  const userID = req.headers.authorization;
  const gpID = req.query.gpID;
  const gpAm = Math.round(req.query.withAmount / 0.70);
  const withAm = Math.round(req.query.withAmount);

  console.log('Withdrawal Request:', userID, gpID, withAm, gpAm);

  if (!userID) {
    return res.status(401).json({ error: 'Token or username not provided' });
  }

  const userData = await checkUserExists(userID);
  if (!userData) {
    console.log('User does not exist');
    return res.redirect('/login');
  }

  if (withAm > userData.balance) {
    console.log('Insufficient balance');
    return res.status(400).json({ error: 'Not enough balance' });
  }

  const validSurvey = await canUseDailyCommand(userID);
  if (!validSurvey) {
    return res.status(400).json({ error: 'Must complete a survey before withdraw' });
  }

  try {
    const response = await axios.get(`https://apis.roblox.com/game-passes/v1/game-passes/${gpID}/product-info`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    const gpData = response.data;
    console.log('Gamepass Data:', gpData);

    if (parseInt(gpData.Creator.Id) !== parseInt(userID)) {
      console.log('Unauthorized user for gamepass');
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (parseInt(gpData.PriceInRobux) !== parseInt(gpAm)) {
      console.log('Price mismatch');
      return res.status(400).json({ error: 'Price mismatch' });
    }

    const newBalance = userData.balance - withAm;
    await changeUserBalance(userID, newBalance);
    console.log('Balance Updated:', newBalance);

    const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_067FAC9F24F60F3E84961D240AE97D0C8CAFC084F4C80C3D1116FE40293F7B6E45D2C331BB8E2A12F4F5BC849BADF338791AA51B6433B2D21D29D2BE659F9052F493928D841A310BA2F2D79C5701AD875DBEFF1E38369F080A6D0798620D583C2FD233A5507A44F816F797320F5E6C703078B05207D4DCDE4088EE30BE98811FA6E6DBD8887FC2701CAE39D7FF5CC20F254DB94FC1E2B62100D678F33B09EF76DFD5D71AFDE27097EDAD700F24AFE00EF38A8ACB35E00118D3EE97AA973E9E5BDA3AE1E314A77ABC1345B2651EFBD742D8BD7CA09494118E6529E64E17C968231AA3BDB2E41DE7F19CBA77C8DB3528A9ECB08BC7BE36D5225CC07648E36843F2CC6785845C65E1AD52C3CA9233C648199B3B8B79D987505E3B9A0C7FD5A9E77161DAD6115BB45F37F93CA3AD9E4EB98199FCF42B6E5FB9B4B419AB99DA08012EA66C72FEBD83990D11C5DF8CB51169C1B42E98273A4826D23943460CADD1C5DC70AC2B177BEEED417F304A9A8C2D6B5A41676B2932388D330F0CE95A7CB306C4D036BF6E6CCD8D04826964CCDA2E7CEE720D168CBFC228134D2CC2FCBB50B0FF0A978A086EF310EECA772946868B4ACAE7AE8447BFF66FDF062E4C85FE3A35E864E07887E529AD3B3B986FAD9704F4B0E22D510558A1E2E58B232F32E01A936EC66AFCB65B87C6310FC6D3E7CAA254BE7DE70C76E65BA8F34E642C1C5241F50A4E3B4047DB292276530DEE9EEA90EBF1EF172BD909CC5E61FE95987F0C382906FFF7581F9A213C26073A4A87A1915864D21F60E570E6F9B83F0B0E437CFBD074D43A2B6B3AAC32CA6203D1FD33DF61E020FB05482CCADED8F0CDF9DD59DFE59F62356313B002A76E5C4BBFD9DB0744A4F8D0201F07B3992703C5B1A71C2ED21F92E95F19B9AD284B321CF5567C5A1BD20A3C609B22F462979008E21832530B4B4039DE167590B6B2D7ECC64A330071E226FF6E122187CBDDD054CE05FFF36BC54AA45E3EDA8059A68653CAA3555B9CEB76A2C508E0386B6E2C68E572CD8C1E16425138029E938831BA26131B134CCD68731F4F1B11258CF99E82A94270650AD8E576C034309E0627BEC78F044496F1036A882240'; // Ensure this is updated with a valid cookie
    const csrfToken = await getGeneralToken(cookies); // Get CSRF token here

    const productId = gpData.ProductId;
    const purchaseStatus = await makePurchase(productId, csrfToken, cookies, gpData.PriceInRobux, gpData.Creator.Id);

    if (!purchaseStatus) {
      console.log('Purchase failed: Low stock or invalid');
      return res.status(400).json({ error: 'Low stock! Unable to purchase!' });
    }

    console.log('Withdrawal completed');
    return res.status(200).json({ message: 'Transaction completed' });
  } catch (error) {
    console.error('Error in withdraw route:', error);
    return res.status(500).json({ error: 'Failed to buy gamepass. Please try again.' });
  }
});

module.exports = router;
