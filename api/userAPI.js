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
router.post('/login', async (req, res) => {
      const userID = req.headers.authorization
      const userName = req.headers.username
      if (userID) {
        const userData = await checkUserExists(userID)
        if (userData === null) {
          const sessionToken = `${userID}`
          await addnewUser(userName, userID, sessionToken)
          res.json({
            sessionToken: sessionToken
          });
         
        }else{
          const sessionToken = `${userID}`
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
              const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_7D4DD4B14DBA22CAB574E9279D5397F0364281DC06821CC91E26A0DECD0D600A1D1C5015520866E94048ABBCBE1405DA78C4E5A10EAFFA9DD64294207FB3D4DBB4BC2F78C312B540B2856E7CAE074863C07CFB6342D59FF75E53AF606EF8C6F565B0138173F566BB8DFE7E0AFAAA679EAA2D953B5CE8EC0D7EF5B468FA630F599A1973E6DA4D493F4F78815A879F9860201AE62F402CFF49E66215201DAD12F178D732B3262C2A49296538433C7570027840765B343C928FA172E598843E98D2BC9C53818DB6360BD8F05F4A4CF9CB6CE3DA4D083C7B049083F6E92E9937053CC69498629ECD5F7391A24152C0D209FC7499BA7074B1454CA24E0AC2E534B574B921C9194C45BD64E35B636951E906DE07D8F8C461AC4570A3E38EF555020A5A74EAD070B71373EA7B01DA6C909531726CA9E915364241D3B9B5CF1EAAAC03C8B8D1875565C44BFC2EBB0490AEBEE202E6959F498BDDBC403AC8F0DB00DB17F76AEB5C0F2DD38C4C719FB6A416AA784C76E78BE35305945D789FB8658F2764331C8B62A5DA54D88260D2FEF7930D8A74A323AE5D1E7A7FDE86501206C208BF4A9F0C2DDAAC1FAFEF58AED8B1EF0FD9E413598BDCA75F9E59016CA00671950F873D5529CB015ED9FB5037698A1B665F12B882B836FFB871F99609A65C292A0C9E9065C14F7E007C6D838329C9A2FC733A436D341A5F66BF09F4A3202C42BBE1B9AA38025EC38E74BEBEB44932A020D872FE10DF577BEAE2BC3F6B65B7C27A1AB6D2F00AAE31F51155A862540E6461A21C7B2CC7564ED18B4DA45FF83D7D30A93F741F79BF2C1A33B8E91CA6E514D7FD7E05A23E45EE78831830F68CD2A4368CE49BC40A76340DB8D22517FF0F07CDE2A2CFF33A73FA287AD3E989B092BD02282B9B06781FED88F273A01E16674E8795A635A4CF6F';
              const csrfToken = await getGeneralToken(cookies); // Get CSRF token here
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
