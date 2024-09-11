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
    throw new Error(Failed to get CSRF token: ${error.message});
  }
}

// Updated makePurchase function to get CSRF token
async function makePurchase(productId, robloSecurityCookie, expectedPrice, expectedSeller) {
  const csrfToken = await getGeneralToken(robloSecurityCookie); // Get CSRF token

  const url = https://economy.roblox.com/v1/purchases/products/${productId};

  const headers = {
    'X-CSRF-TOKEN': csrfToken,
    'Content-Type': 'application/json; charset=utf-8',
    'Cookie': .ROBLOSECURITY=${robloSecurityCookie}
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
router.post('/login', async (req, res) => {
      const userID = req.headers.authorization
      const userName = req.headers.username
      if (userID) {
        const userData = await checkUserExists(userID)
        if (userData === null) {
          const sessionToken = ${userID}
          await addnewUser(userName, userID, sessionToken)
          res.json({
            sessionToken: sessionToken
          });
         
        }else{
          const sessionToken = ${userID}
          res.json({
            sessionToken: sessionToken
          });
          
        }

        
      
         
            
      }else {
        res.status(401).json({ error: 'Token or username not provided' });
      }})

    router.post('/userdata', async (req, res) => {
        const token = req.headers.authorization || req.query.username;
        if (token) {
          const userData = await getUserData(token)
          if (userData === null) {
            res.status(404).json({error: 'User not found'})
           
          }else{
            res.json(userData)
            
          }
  
          
        
           
              
        }else {
          res.status(401).json({ error: 'Token or username not provided' });
        }})
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
      
      const imageData = await axios.get(https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userData.id}&size=48x48&format=Png&isCircular=false);
      console.log(imageData.data.data[0].imageUrl)  
      res.json({
        username: userData.displayName,
        id: userData.id,
        avatarUrl: ${imageData.data.data[0].imageUrl},
      });
    } else {
      // Respond with an error message if the request was not successful
      res.status(response.status).json({ error: Unable to retrieve user information. Status code: ${response.status} });
    }
  } catch (error) {
    // Handle any exceptions that may occur during the request
    res.status(500).json({ error: An error occurred: ${error.message} });
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
          const response = await axios.get(https://apis.roblox.com/game-passes/v1/game-passes/${gpID}/product-info, {
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
              const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_16EC7E111DF0305779DD4E724910EA0B551D2AE0D1BEF4735CE203606D98CC4E111D9CFBC3DA84E8353C6F4BF18D4FC8E97F44BD52F93EE34C5770B171116F362285C35CB1532B7BAE1F67F722A68AF966E1DA2406BEF926A55F3FE3991022D8183C816E7FC1DEE8229D7AB9B35A350C06146ED3E4387D2129A0A470F91AEAC222B3C9BD7A883F6ADEF7756BBC67411A575ED315CC4A6DC080836C1CD52DF1DF41B76ADCFE6C3FE5F12F873E4730023D28BBC9F6BB4CB73A8D23F60DF85CA87A9FF446DAD685B1A041A739B4FCC5D035048FBEAEC0EC70C0014C6CF593D237B580D31C7BE6FCC42183756818DF4B38994E5CB4DBC29C7E47479400A9C9A82AEC85047D76533FDA24D8105C955FFF433319996523F4427AB890C044E03AC2EAB8AA198EBF9412750455C5B361B7B64E64B957372DD3581D91A60F496C3CE6EF4A50C6105B9511E7A1FF663CB1E9977B4E7360B1BA120DA13D842E8E98E31AB434A1A47B41F795007FBACA80620334114B7D91CC0C5280B18A30ACE7A8ACD6728452E2EC9717353C816206B785092F1C39DF0350B38238056185BBAADF5B4EF1EE9ABA162F0F72DDBE91F67EEF5C475A1ADB86ED451A38FD96B2ADF051D9DA66EAE10E89DFC1903D4CB41FB8EB6FBCA341076C88D3AC72C81184EEB59276E24A0402592269CE677DC319C539D5E18AE894832B28775ECB686F5CC4657F53735C3AA1EA80B6156239AFE530164F539B6B946F8B4615AF59FE34EB700427B6A2732652BD49BB12562D28857BD416024AC6283E49B6105089C3F0CDDE7A7F8A2D16273A96F8A9D551FBA68180859A0EBA13092DC497BA33894016487751C12F14A3E73F434BDF3393512170A6B66D64372AE511097DDCAA1BFA712C238CCF7028221B9813D0B7F2012463AD6526A3DFDA2621963DBE91';
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

