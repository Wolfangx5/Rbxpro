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
              const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_447284C796AEDA73547E2A4A17A82989F9BA195E7409A1F98477014201092CCEA569DB26A554EB1B9DB855A8FCA9917858C6FCB8F06797FBD8CB88499945F191732E621C41A2910A9C3A2FF9E3CB15841791845DFD7F46A3E515B76CEDC3050866C8B09B416B604A5A24707A3498FA14D70C1C908D9E9443B1E4D89B5DE8FFA022C00B67C8ABB4CC74F078A0548A50210C6EF56F2FE00B84F8DD2FF88E4B45CB73A7CBAA0F15F7415769A63FAE6C9C3682A1502D172A437C4D3693461D267DBB4CD01092ABCEF50B096609A9DFA15D204BE658046950A2FE902CCF324D9A4955BEC77D0BFBFB8092CD6352C053B4920B3E9774C6367E12A9FD204EBC5E6F0D9AB5F121C904178EAE39416C1FC537E0A2EE9B51243A2E371A078C89032E5CCDA951B03534F36DBEAD8AEF6F14A495ABB1961A62A7DBCF20F170BDCE109827E988435335855374B507EB3F267D8F4A2488E901BAEBBAAF942D7D8AD79057234BB7A1B5CB73242E6B62EC96BEA61EE1FA48E5B41FEBC840EBB1544691E29D3BD2036A4EA34B1D51AE1616B30770EEA4C4BACCD8731358382083002CC5D7D3C369D7D849FF8065B35E5E1203200EDCC748EBD4D65A511335AF8D379B2419453F7D91655FD3BE95E87035EB14D51F1A6932C419B30CF98569C2896C9CA0A1BD8D58C90A6C0B8FB0BBD4ED5C493678B61D8EE7765BA04E033836A31DF4F7DE0FDBBB5FB77CEE720DF3A9ED8961EAEDD28AD0C4A7DC56A0966F66C9DAAF10DE2435B0D5F20132792BAC056B449DB9253C2B3223854497E107A057FFAF1BEC4504B10DEA63EEA01E2B8EB52718D5C5E6099639098FFD8F342A53A34055E20AD249A996C9C8302450904A059701B367B3B00661E8A8A4C6E9B02AC3E531439A9AAB94A6ABC5CDD48E4B211B6C4EB29F131C8059A0CEF55B5E';
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
