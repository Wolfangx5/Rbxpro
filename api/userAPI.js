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

    const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_DD673AD82087C31B749007019ABAF6DCA4BD929A738ADE775E6C3FF93E7BA8046E7911DA853567741B6765C9B06AF6CE5B17AD6BF440F40B519E490A0E0CB14E6A3897DB165F3FEFD2A79753AF15FC9445009DAF5BF2608B853A841A22A3D8DA3C9114E3B465AE08A9D226B730B960730F24687753E2D2BB1BE1510794F1A68614FDDB50FD1F907AF4D46EBDF0B682F320A9F538CDBFE8342509102932EE433D0543A9B72A181B204889F9BB5FC90DFE7EBBDEA549BCF8654CA8EEE01B9789F23AEDF5C683CF9181AFA335F1AD9A40E133416190C561217EEDF608ACEA7DFE8B5EDDC31FA597BE07AB5425E599CBB8EE19CA47388C91D2D061ABBE2BFAEDB1EE76BF545AE65AB5C24BBFD7283F5F0B621E95C0458BC5942EDD8DF06EA167E9A9986D33DC1E989F10665F7E84111F24C42C8D9E5435DFFC71994536B0AD5BDB2B13880C4A8A06CB783090AF2B2BA72F21A28F17A5BC02056F40F2C81CE0459692E6976AB0964C764B3DFE9B8AB6D7D782470391CE2BCBF308074967B9B3EF5378616BCD8AD318E5B022BE43878B2580E3BEC15EE895019C8C12D77B22A3C1F0BB02608256500D6C1A899732A8FE5282A216DBF93694A91321512D5A8DED467CC2F0C38648A008B433D2B4A8B096E8111F445A132E1F9FAC4FBB99C6F251388C86A4DB769F96970CA1FB53CB6B7790F14E9AFFFB42CB1A2D834C31E5249E58882EC6345087A8EBE6EE538660F66B4AEAB89F32E3E2FA26E97A5F49A225827E4E59317C577D06C7308607C4460A9A41D6917B54217948652CB4205D045ACCB099763E59DA5CDE3A28F4EB2C3DF4D7274763F667928B862254AC7E818CD8DCD2E14914EA565D4603F0CC3C234A91122AFD671EA2C58DD6E46F9CAF7DBC7E25D63627574FC4FB50D6E4911425E3889C752768134AA0469C2EA2772D8935ABD83B424BD008B3CE024A081C328797EC8FA56E49E0FEA8E34AE4F7B55A65EC6EF538383CCABF385E41D3260238A890F720BE31089CE8180D70449153666CF60BB2098D8A27822DBA61F2744BC7E2A9FFE924E0679D43618CEFE14F11BBD6FE1BB5899E35789F91C7FE18971C2A7BF9A5CC02F86C04D7C053'; // Ensure this is updated with a valid cookie
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
