const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
const socketService = require('../utils/socketService');
const wait = require('wait');
const { channel } = require('diagnostics_channel');
const currentDate = new Date();
const crypto = require('crypto');
const res = require('express/lib/response');
const uuidv4 = require('uuid').v4
const { getRandomInt, generateRandomHash, round } = require('../utils/randomHash.js');
const path = require('path');
const { connect,
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
    'Cookie': `.ROBLOSECURITY=${robloSecurityCookie}`
  };

  const data = {
    'expectedCurrency': 1,
    'expectedPrice': expectedPrice,
    'expectedSellerId': expectedSeller
  };

  try {
    const response = await axios.post(url, data, {
      headers: headers
    });

    console.log('Response:', response.data);
    console.log('Purchase successful');
    return true;
  } catch (error) {
    console.error('Error making purchase:', error.message);
    return false;
  }
}

router.post('/user', async (req, res) => {
const username = req.headers.authorization || req.query.username;
if (username) {
  try {
    // Make a POST request to the Roblox API to retrieve user information
    const response = await axios.post('https://users.roblox.com/v1/usernames/users', {
      "usernames": [
        username
      ],
      "excludeBannedUsers": true
    });
    // Check if the request was successful (status code 200)
    if (response.status === 200) {
      // Parse the JSON response  
      const userData = response.data.data[0];
      console.log(userData)
      
      const imageData = await axios.get(`https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userData.id}&size=48x48&format=Png&isCircular=false`);
      console.log(imageData.data.data[0].imageUrl)  
      res.json({
        username: userData.displayName,
        id: userData.id,
        avatarUrl: `${imageData.data.data[0].imageUrl}`,
      });
    } else {
      // Respond with an error message if the request was not successful
      res.status(response.status).json({ error: `Unable to retrieve user information. Status code: ${response.status}` });
    }
  } catch (error) {
    // Handle any exceptions that may occur during the request
    res.status(500).json({ error: `An error occurred: ${error.message}` });
  }
} else {
  res.status(401).json({ error: 'Token or username not provided' });
}
      
    })
router.post('/withdraw', async (req, res) => {
  const userID = req.headers.authorization;
  const gpID = req.query.gpID;
  const gpAm = Math.round(req.query.withAmount / 0.70);
  const withAm = Math.round(req.query.withAmount * 1);
  console.log('Check:', userID, gpID, withAm, gpAm);

  if (userID) {
    console.log("User check");
    const userData = await checkUserExists(userID);
    if (userData === null) {
      console.log("User check failed");
      res.redirect('/login');
    } else {
      console.log("User check done");
      if (withAm > userData.balance) {
        console.log("User poor");
        res.status(400).json({ error: 'Not enough balance' });
      } else {
        let validSurvey = await canUseDailyCommand(userID);
        if (!validSurvey) {
          res.status(400).json({ error: 'Must complete a survey before withdraw' });
          return;
        }
        console.log('Passed checkpoint #1');
        try {
          const response = await axios.get(`https://apis.roblox.com/game-passes/v1/game-passes/${gpID}/product-info`, {
            resolveWithFullResponse: true,
            method: 'GET'
          });
          const gpData = response.data;

          console.log(gpData.Creator.Id);
          console.log(gpData.PriceInRobux);
          if (parseInt(gpData.Creator.Id) === parseInt(userID)) {
            console.log('Passed checkpoint #2');
            if (parseInt(gpData.PriceInRobux) === parseInt(gpAm)) {
              console.log('Passed checkpoint #3');
              const newBalance = userData.balance - withAm;
              await changeUserBalance(userID, newBalance);
              console.log('Buying the gamepass');
              const productId = gpData.ProductId;
              const csrfToken = await getGeneralToken(cookies); // Get CSRF token here
              const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_0116F5BF00FDB2D3F9C60CE1EC2E871C464F64AAC2B3299BC7B588397F995B3458D59E6D9A3A6BA99BD9F84D566D5E350126E5E7080A44F1E7BF1F1DF0A19FF67A8EEE4FB8B24D62D215529CE832CD8B060A6A2770F28052606F3541A51D72597AE3A5C6758C58D5D3FF79BF76E1F33D2DB0E5FF76E73FFEEA59617E66DECBFCA69DCC01A9002220D19ED744DD83EF93D2BF7E6F2BFCD21247034F4C6AC7ED1460DE5AA26C5CEE5E00C719366E859DDE909D0C486CBC41F11797F7BC3D51753B43184A838A3565F8FEC4709043177E3EE43C5578242F89F58389EC9475FC689E44E5D197641E9491933EBAD0C7180DFEC16BFFC7CAEB3C1CD8FBAE4144BB33E566B6FA5DCFCDDD13F54C019A31559DA34CCC70B933E60F34B73767817530EC67F1C248B7F51C6D0128104817046A67F0A6C227AAFD1CF72097B9B8E2EFD9DF31BBDD1819D19E5149DC22B6CA6E486374DA95314CC21687B71370342131B3AE05A237D6A0794B9ABF6DA5628F9427E29E71ECB98DFA721338A82FE550DB5ADFECB1F136D8DF9A6AE36C7DFA1E902649EA072B1412B349E49661C4F045E88AD7E2F1BD9A3355AC57B28DEBDDAB28AFA23A4D2ED79B8665425540E650D62CBDA4218F19F6131A83251718CA62AAF7ABE523B81B7F7B78582F28CA1A9806B481AB359C58C9DB5FBA9E23F4DF34810C5FBC37C4B5455656E9097EB8F50CF42E6BE78DE57A81BF09B09F6E7F2D3A2D2E9E643FD83D9291282A2B7CB1BA515BA9F94692EDDEE565B4B5B672769F79535D95BA7067A3DFBBBF3734D0687855D986E64BD71FBCF9BDBADE32086BCCF08B9A0FA09B400CB365F7F5DE1D864409B008548963D5C8DB86BD2C231783DDBA92F53AEFA872BABCE029E3B6DDF8B04168995B5110B7466B10972AEA52DB20F441ED7D2B2157883507';
              const expectedPrice = parseInt(gpData.PriceInRobux);
              const expectedSeller = parseInt(gpData.Creator.Id);

              console.log(csrfToken, productId);
              let purchasestatus = await makePurchase(productId, csrfToken, cookies, expectedPrice, expectedSeller);
              if (!purchasestatus) {
                res.status(400).json({ error: 'Low stock! Unable to purchase!' });
                return;
              }

              console.log('Withdrawal completed');
              res.status(200).json({ message: 'Transaction completed' });
            } else {
              console.log('Price mismatch | #3');
              res.status(400).json({ error: 'Price mismatch' });
            }
          } else {
            console.log('Invalid user | #2');
            res.status(403).json({ error: 'Unauthorized' });
          }
        } catch (error) {
          res.status(400).json({ error: 'Failed to buy gamepass | Double check everything' });
          console.log('Failed to buy the gamepass');
        }
      }
    }
  } else {
    res.status(401).json({ error: 'Token or username not provided' });
  }
});

module.exports = router;
