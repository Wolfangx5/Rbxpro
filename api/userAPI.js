const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_C808703668093A309D9EB37AD9871D36F46496FE18B3416D05A5CAC9FE975E56CCE0EC14A46515BEBD6DBF165F24ECB982614AD802D754C6A8DB045F34149D6E5FE17F3EF91993E97D0F5F2A5F9F5423D130D663728D966C06F07513AF1B231737454ED80A9767EB7F2F3FC3E382AFA766F007CD074DB5788C7A4240A0FEA1B40E2731A1ABE83DCE13B313D1A0FAD6A089C3587DCC1E26F678E29949C46BCCD7010C5BB43607BFCF767734A85CCAD0F15F3E508593FE2AC55C352E8051A701880DE12904BE6780E29705A761F8B070F3BCFCC9764AFCA22A840E3E2B64FAA2F148CBD3E2C5A35FB34B476676120CAD4459A5FED34C00101E13C4711CDADCAF5A15D00609EDA730EF45806DEB3B5A62355F1F49522578329120A10F3057F29F4DD0A82DDD44CE1DF4967C014BE7244809ED1E70BCF1397265AF4947D2E68808AC6DC795DED2916D42EA5CF870B1249E176890D3C37F122BFA5D5831B0BAD01BCB36084EFC22D8DB540BDF2730E98D6E46E3D09B5608EBC7782AC84E45CE3D2A6CD69CC2C11A07A9BF072F16E448887723508CC48B34B04F0C4F8775DA527D23FBC21323269C883726257A95B7B9F0364754673921A53C92D9807B2B1B4A82E2017A7519080B577F50D3A65C09B516211B3E5C1C717F780E4120D5438CBA9F1CC1FB8E7DBF3A1FC4DD01158CDE05929388CA1DB01F9BDC7DD7FCE00CC2BF80AB1508CDC55291577E638454582A10F0284DD791D419619B4FA85EDB84A30D0703968B20752197F6832A62F8E65E74FD58C1EEAE29F33B964749F87387704DC8D3F43C65D3C3DC29F994702C5B00149E951779C3146A4589ECF101859F64755611973F7AFA41028AD83C5D6C6AB248ECC9F783578402510020C1AC1125A5FDEE9A4544A0E2761728772A6ACDD1012DBE6415595442E4')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_C808703668093A309D9EB37AD9871D36F46496FE18B3416D05A5CAC9FE975E56CCE0EC14A46515BEBD6DBF165F24ECB982614AD802D754C6A8DB045F34149D6E5FE17F3EF91993E97D0F5F2A5F9F5423D130D663728D966C06F07513AF1B231737454ED80A9767EB7F2F3FC3E382AFA766F007CD074DB5788C7A4240A0FEA1B40E2731A1ABE83DCE13B313D1A0FAD6A089C3587DCC1E26F678E29949C46BCCD7010C5BB43607BFCF767734A85CCAD0F15F3E508593FE2AC55C352E8051A701880DE12904BE6780E29705A761F8B070F3BCFCC9764AFCA22A840E3E2B64FAA2F148CBD3E2C5A35FB34B476676120CAD4459A5FED34C00101E13C4711CDADCAF5A15D00609EDA730EF45806DEB3B5A62355F1F49522578329120A10F3057F29F4DD0A82DDD44CE1DF4967C014BE7244809ED1E70BCF1397265AF4947D2E68808AC6DC795DED2916D42EA5CF870B1249E176890D3C37F122BFA5D5831B0BAD01BCB36084EFC22D8DB540BDF2730E98D6E46E3D09B5608EBC7782AC84E45CE3D2A6CD69CC2C11A07A9BF072F16E448887723508CC48B34B04F0C4F8775DA527D23FBC21323269C883726257A95B7B9F0364754673921A53C92D9807B2B1B4A82E2017A7519080B577F50D3A65C09B516211B3E5C1C717F780E4120D5438CBA9F1CC1FB8E7DBF3A1FC4DD01158CDE05929388CA1DB01F9BDC7DD7FCE00CC2BF80AB1508CDC55291577E638454582A10F0284DD791D419619B4FA85EDB84A30D0703968B20752197F6832A62F8E65E74FD58C1EEAE29F33B964749F87387704DC8D3F43C65D3C3DC29F994702C5B00149E951779C3146A4589ECF101859F64755611973F7AFA41028AD83C5D6C6AB248ECC9F783578402510020C1AC1125A5FDEE9A4544A0E2761728772A6ACDD1012DBE6415595442E4'
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
