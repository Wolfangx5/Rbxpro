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

    const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_C0D6192015C2EF0C23CDEEAB17FFF7814EE03881727E933F70F1288BD404DDFCAAD586D21D0982749AD1CE992D85E9921EAA204B51E48307821608F6BF0679FBB2DB9ADBFAEA652A0985C57AE063E3FE164D9DE14F7216038C0F0557DDFED4C5D6321D109582967FCE52024DE3B41DAE59ADA9B81BDE3828E2671D5D70D735F39BEDC29C11F21190D54D16E26EF7472AD1CEBD285A67646F17990430847748DF81862BA729D869DB4E549D1E2D29DAD070F93FD2601A811250C672176B8FEDDFFC250FD2BD40CC4C8F803848748EA6FEAB99BC86677E79E0BA74D6F43EF46E32AC5EDC2BEAACC16939B6F2457A6DA9D86AE7272D7516754CF0C92F68F838DBB16262D1E5DF8B03DCB6F3A1B5A088B3590827274A04E9C70A4DFCA12C86EFA070A01D48C3ED446325984EC91A72AE4A682AAF73F209E0970AC5FACC2400A753AB79066A1D3D5B5071013BA13E9A557C655CE5B5AA9AB651263757B4F70F7934DA0ADEBD4E7BB714C509BE49B448DD6FDCC616959CE2C4B4B1104ADA8B29E620A7625D0C34203C07A1CE35353BC3DB6E341AFE4333ECF2E279F4D7EC606330A6D2236270EE136D6557D69CC4AAB4053BFAE3067DCD7C40F08069E74A91D8B0BCED0B8B3562571CDFFABB86CDAA5D01D1DF65C500DFF8A235C4C14C6A66FA9090BD725A6D217BD3E10F79B9BD4A173B76FD16FFD033B81A5730B2225FE1B74F71B1240D0A3419D4D67B96FAAA1EE9A1D40810A8C312D63D695953E3092C70DC39A74B853FCB7016DBBC9ED7C624976D43310891251CD63191B330D60C8FA0BFE18179068FC3DF2B411BE28163CCD84E246FFE1A1B833FFA031787CEECE9DBC780123AE35F4A4AD0A9EC820A9325FD28889138582BD934711DD76CFE81357994074918FA279B0B31A445AC52EDBF53CB53AC2AF7E2BE801ACF41122880E8CFAC0A2409B8E4EA2F3616831ED9B5E97F5C0EF3798215B4FAD170590F11ED60DC81A260ABA5CDD9D9F4952C2F758EDB8EC182DCB282781394243DCAC4D9382A894E04DAF91807080BB2986C306C45996928A791B291C2093072C487AFD77373766DC379C3D85D96DCB889496DB70417BD278DBD1D226FE1'; // Ensure this is updated with a valid cookie
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
