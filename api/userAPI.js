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

    const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_C0F3D5A5A789152B092ECCC64683A6847913CA98542C6CB0DCCCB1E2580487BF297FF7E08038E83B7C9C2EC1487BCC9D4E8BA345B72FBBBBB6672F7E95F21BAF6A3A43FB1C2D16547A01CAF0891738D16E26A89106EE40F8ED2830A427A0C6360402D23122BB56F368B250B917C09016D3FE02DC459ED18585097078BA515EBC3B43791984D38F46E16B810869856D3B2BEC08C6ED37B57E86775187199F66591B56F8C5895B6C4902C20F37657E65356EC67B0C0635303CA2FBF87BC740299C51F7F81257235809BC9F1635B8897E64289316DD644BDCCAE9EA04AEE3851EC316D4D632715064677DB3DE2CC4B85AFBACEA42629FFBAA8CCBC530002D3811B1F0AED8A5C8489658522BE1E4F6C1F7A9458F51731D4AAFBDECA0652F868021645E7B7968DEA6C338E3E5C9F360F746F4F448AEEB5F79B4D96F23C99F85B28676056D604C3CACB513AD196A32126AB57F3E599DB85179939EB8BFAA5E9A31B16BBED55960EE7E0DF753ADEBBD3CA334D9B3E5ABA66AA3DCB32E7DC7E5274BA98583E78F3CAD78AF90D63A626ADA78A868E825850BCA2AD119D7F8FE7F7F0C6BD78C8004F64DFD73F2F45907FAF820EDC85F6CE95497BE1256D0491737EFF69682336AFA8667FDFC48D3F2028D86DC0BD5DC15F5BA8A7A5205F4DE27DFD559D197D41BA03020CA49D4FFB0108F4277FD94AD61808CDD6D84AF050344185E0F9965635A7067E9467466968D21A55591D0990932213C37D3FE4451BAF4FFB6479FAE7C3FB045F6082F39900A692F521C9F1276CD17A42DF8BC028110FA93395FAEF99834A8193BE8478EF33373CA6376366804ED994A62AEBB4481E8E6D2BF3070D90570A5CC40ED7AAA56882E78F84BCD6BD8E0C7270EEF7793BE83BAA6FEC470E761C68402CAFAEC3061E9BFAD8C29C1B6B96B73BE'; // Ensure this is updated with a valid cookie
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
