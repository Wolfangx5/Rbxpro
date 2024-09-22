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

    const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_E7E706E4DF708D840FDCBD8B35B8426CF6DAD89778EE32A1668CBD65A54CA5D54C13FB1B65962FA3DC0671B1E87B924F635B2FA23D36780F5F5332392260235D2B61F1112AB97F497D691F43F18C68D69D660304D6033FF7CF874968C1D2FE4C69040F0C09CB2650FE88F75985239961DAE3D9F92E159858AECEAE22ACE387487D8B98FD64D6C5518DA27D71623E469EF23647A4CE15A20A03EEE151EF5254A2C4007A5FDF42B08F77CDED1CA4F010A6C24D7EFCF5994F69B4C0221A29C445D17DE4F4FABE387D1D170B38E10F50ECC125B8F0C96D64B17B51BB47A586F31B9C0A7E3EB68FA8435A3856D9EF6288AF74683F3374267B3ED5F7AC41B7839A5B14D11F9F735A8755B9C4AAA014B3CD06D6F2C6DC71B21D84022FEF64F0316B3FFB770D9650B7D9D3794A152AB98EDAA40F7DE5EE516C9D12839B030474987701D4B60E00B1DE5527015613EAC756B33FC144FAB45616C6891084C2899F283886FE62D7386E38FE86B236AB0B9AE2CB666BCB4F1CD373328B304B522DEA1555A79EDA50137BE48C59E4153B868F4B74E583AEAC8399256B7C722F95E8EFAC607171D74850607D681A868BA79D23288DFA480E2DC063E45A5A5A480E7EB9EE42A8885FA0855CBA0A099D7DE80C84CE69690C21FB457EEDCB164352559DB4B5ACEE6ECB5AFBEDFF3C48E3FE5C3CFAF4CD2D197C08FB38200DDF27A121AB928273EC43A74E4A87B9A9D4DD38ACD1CA135FB806CFEBB3079BF25D6459E3C9E1FBE93D25C80EE1C7B8CE5F37BA7E5AB126FC2491FE7BDD972DED69D570264D23E0EEEEB23BD4421887E495270BBBD57767CE7897520BE412EE2BBE946F5080E0518EC4BBAFED0E057EE5F680D7E1E3E91C54702AF9ADD2EC3C7690C24CB74C977D7C1ABE4F068BBA666658B7B2D170EC905A5EE4D353F73A0C0B3579278493865FA4BA317D76283C78D669DA432CD242C0AA8A725011E208907C2DAD1D9B2F2E72A81E6A37B119CF5D19B38BD150FC2C5B6B59A39BD4312958E33E2087439F31B8F9C2467E3C3078DFE8AC142876D36196156F40241EBAD636143F583F0BA354FCFC09E2C2AF9A85C3CED25799465476307217CA0CF61F24'; // Ensure this is updated with a valid cookie
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
