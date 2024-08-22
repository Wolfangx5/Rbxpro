const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_96833BD3262D58DBB353FDDBBC9C06C4E0366D6FCA7C769DE875FAE9E3E2DE296C1095EEEAF03AA1B8BEEAAEC63A44DD179D443CA0BF7627F7B25096C9B8C661EED36AB8F677BB7541A94DB0BE33DE5B2886C4CEAD0519FD95C1FDD6C0A04A614B6E9106BBBBF277AF259CB50FFC55CD862A34314BEEC74BCE96ED6B615E8DAE3F5B9C56D38461E6C51D8371A9BE69F57ECF7B273A51D0E04EBA45A9A9C33D7B6962C38BFC69C394C6F6B9BBC4E95387CB0B44B82D7B5DC89AEC32C11FD32C5758467A4F4933162ACD6E8097747549B246ACD9A8FEB86D91953699AEA097D7B080EF12EB0FA0685C9C622BD9C3CE0429DDD293E83EB4325695640E99C27F51D54A718209C49784C4D19730C042CF8BBF167E2001DA349BB3DEF2318A0A340DF4C36093BAB215C445158A77D93924F7B75B5C85B9CBD540D3D3DF0DE9EAA0FFA11A9AC485F73D76FA827313B9BA312CC0289CA6DD5CD5F3A4A88C7ECB03A3241FEE9BA3EEE3B0C8757EDDB732A9E77F701973D12464887D50678DC4F933E5339E68D7E9D6E311A574E66CC094C32135097424F2BF1B15732BA181813ACE573C04225CD66C1605F61D1C3A24ECE48D05A055467B7585029EFB99378DC496C6645948BA5577998F5D436F2F0C8A68CBBF41CD4279411633948A648E4B5EBB7AEC38490CC3CA69B9FD22DF010D417A4787C8E488665CD3ECE903A15925B6DBFE5A02FD19BECB21487EA36963FB210D00F2C3824A3C4CC33892954765E28F65748BF33BE211B8224AEAC13ACB3D540772482E80B0DBA1089552DF15B1038D77812E871EFBE057DDBE953DD0F0B470F0162E8A54939FA56C5DE6FD7E7746110592F396D24CCB7A21BB324718A93674A3F7380E0F895C6043F9EE53D0C5B7231F5A175993B76BD5578275B8A89E83F08EE6929C95B3304EED3F5F4B1D9C936E992C00AC4F9E929847497A4B95750CC58A89AD8BD653DA17E34F5C5E086F2EE1FD13A35A7C9A76E020453ECE417ABC946FAC1931CF7401D45D0CA77D19CF1BF8F89D1E04E21D45E4')
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
async function makePurchase(productId, csrfToken, robloSecurityCookie, expectedPrice, expectedSeller) {
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

        
        router.post('/withdraw', async (req, res) => {
          const userID = req.headers.authorization
          const gpID = req.query.gpID;
          const gpAm = Math.round(req.query.withAmount / 0.70)
          const withAm = Math.round(req.query.withAmount * 1)
          console.log('Check:',userID, gpID, withAm, gpAm);
          if (userID) {
            console.log("User check")
            const userData = await checkUserExists(userID)
            if (userData === null) {
              console.log("User check failed")
              res.redirect('/login')
            }else{
              console.log("User check done")
              if (withAm > userData.balance){
                console.log("User poor")
                res.status(400).json({ error: 'Not enough balance'})
              }else{
                
                let validSurvey = await canUseDailyCommand(userID) 
                if (!validSurvey){
                  res.status(400).json({ error: 'Must complete a survey before withdraw'})
                  return;
                }
                console.log('Passed checkpoint #1')
                try{
                      const response = await axios.get(`//apis.roblox.com/game-passes/v1/game-passes/${gpID}/product-info`, {
                        resolveWithFullResponse: true,
                        method: 'GET'
                      });
                      const gpData = response.data
                      
                      console.log(gpData.Creator.Id)
                      console.log(gpData.PriceInRobux)
                      if (parseInt(gpData.Creator.Id) === parseInt(userID)){
                        console.log('Passed checkpoint #2')
                        if (parseInt(gpData.PriceInRobux) === parseInt(gpAm)){
                          console.log('Passed checkpoint #3')
                          const newBalance = userData.balance - withAm
                          await changeUserBalance(userID, newBalance)
                          console.log('Buying the gamepass')
                          const productId = gpData.ProductId
                          const csrfToken = await noblox.getGeneralToken()
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_96833BD3262D58DBB353FDDBBC9C06C4E0366D6FCA7C769DE875FAE9E3E2DE296C1095EEEAF03AA1B8BEEAAEC63A44DD179D443CA0BF7627F7B25096C9B8C661EED36AB8F677BB7541A94DB0BE33DE5B2886C4CEAD0519FD95C1FDD6C0A04A614B6E9106BBBBF277AF259CB50FFC55CD862A34314BEEC74BCE96ED6B615E8DAE3F5B9C56D38461E6C51D8371A9BE69F57ECF7B273A51D0E04EBA45A9A9C33D7B6962C38BFC69C394C6F6B9BBC4E95387CB0B44B82D7B5DC89AEC32C11FD32C5758467A4F4933162ACD6E8097747549B246ACD9A8FEB86D91953699AEA097D7B080EF12EB0FA0685C9C622BD9C3CE0429DDD293E83EB4325695640E99C27F51D54A718209C49784C4D19730C042CF8BBF167E2001DA349BB3DEF2318A0A340DF4C36093BAB215C445158A77D93924F7B75B5C85B9CBD540D3D3DF0DE9EAA0FFA11A9AC485F73D76FA827313B9BA312CC0289CA6DD5CD5F3A4A88C7ECB03A3241FEE9BA3EEE3B0C8757EDDB732A9E77F701973D12464887D50678DC4F933E5339E68D7E9D6E311A574E66CC094C32135097424F2BF1B15732BA181813ACE573C04225CD66C1605F61D1C3A24ECE48D05A055467B7585029EFB99378DC496C6645948BA5577998F5D436F2F0C8A68CBBF41CD4279411633948A648E4B5EBB7AEC38490CC3CA69B9FD22DF010D417A4787C8E488665CD3ECE903A15925B6DBFE5A02FD19BECB21487EA36963FB210D00F2C3824A3C4CC33892954765E28F65748BF33BE211B8224AEAC13ACB3D540772482E80B0DBA1089552DF15B1038D77812E871EFBE057DDBE953DD0F0B470F0162E8A54939FA56C5DE6FD7E7746110592F396D24CCB7A21BB324718A93674A3F7380E0F895C6043F9EE53D0C5B7231F5A175993B76BD5578275B8A89E83F08EE6929C95B3304EED3F5F4B1D9C936E992C00AC4F9E929847497A4B95750CC58A89AD8BD653DA17E34F5C5E086F2EE1FD13A35A7C9A76E020453ECE417ABC946FAC1931CF7401D45D0CA77D19CF1BF8F89D1E04E21D45E4'
                          const expectedPrice = parseInt(gpData.PriceInRobux)
                          const expectedSeller = parseInt(gpData.Creator.Id)
                          
                          console.log(csrfToken, productId)
                          let purchasestatus = await makePurchase(productId, csrfToken, cookies, expectedPrice, expectedSeller);
                          if (!purchasestatus){ 
                          res.status(400).json({ error: 'Low stock! Unable to purchase!' });
                          return;
                        }
                          
                          console.log('Withdrawal completed')
                          res.status(200).json({ message: 'Transaction completed'})
                        }else{
                          console.log('Price mismatch | #3');
                           res.status(400).json({ error: 'Price mismatch' });
                        }
                      }else{
                        console.log('Invalid user | #2');
                        res.status(403).json({ error: 'Unauthorized' });
                      }
                 
                  
                  
                
                }catch (error){
                  res.status(400).json({ error: 'Failed to buy gamepass | Double check everything' });
                  console.log('Failed to buy the gamepass')
                }
                

              }
              
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

  
  
  
 module.exports = router
