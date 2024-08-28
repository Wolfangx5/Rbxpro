const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_BCC01F50F8FD613636E733506B5EF44450A1C303574A63041788A8D78E830B099DB5BE83DAEB7C3A1F704A0CCDD3FBC2C5B531E2D4F589EE124933FD42C39B380F6B1B2107FAA199C94A9E6128DAF342C0B1E05D7866F9957E909E98AD01268FBAE21FB8E916F0DABF765E8088A8EB2C56969452272157D8C5361B0E554139C4F5038A2F5461A53620431F21409367C60C5A96087A333A5F0530E1A1A2515DB75CA862BA6A39FB7FF02120BBEE1962897CB0C41FE19555EF3FC43362FE5E7A410BF283DD292E6A67DA39F7C57691301679F85DA05E0BF5D54E4BBF525024278564E5B89EB3A4DF51DB2C896761D9CD74A5717815FE6446B06871694D1147D9EB0133F6832D8FD8B6A4DBCEAEC2D9550DBC32DA1FD39E462048D240B4EFD0BCC46982131B6738060DB1D3301BDF6392DF4E3A349B85DDE4D47E1688C98BA1874E33A9DF5E245C90AC398D61E3F29110BFD54AD35F5375A6A4A4F094D93AD44D694DB0CCB9DEC3D5F9DEC3C1EADA124E9DE4D331BDA49C9768E7BA3D6C07908B9A924D3C80ECC46A4B109016765F54B63C01755F203A8D7DDE5C03C4A39B3709F8AE316527A79A5FFABF1C25BB61C15BB4513B351F3A296C41EFFADE9153D6A1DA59AD80B895D88EC4D8B8025A8C8D3F09E48C8DC4DD6799F866B279E9EF4790E58364700B4BA37192D609D957DB7BDCDD6FA3B37B07A6B1D78CDA5593C501B692A9994833D1A715DABBD7A11AED5FC82CDA37FEEBDE951231F48A39D0468CC3D88D27309B3176DB2E55559CD688176ACD3C8C8047BD8088A8FEAD3BE4006792C9186D094C8339B27778ECDF6C66A480CE6CED62E3F0B6A4B777DD8F0D1272F737E2523ACC9EE9240B2AEA31430CBB152F924CF5611ECCE7A24A4F4B47EFC7DEB7655C1E62B66BAFD9182B6EFD43FD35960199DB36')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_BCC01F50F8FD613636E733506B5EF44450A1C303574A63041788A8D78E830B099DB5BE83DAEB7C3A1F704A0CCDD3FBC2C5B531E2D4F589EE124933FD42C39B380F6B1B2107FAA199C94A9E6128DAF342C0B1E05D7866F9957E909E98AD01268FBAE21FB8E916F0DABF765E8088A8EB2C56969452272157D8C5361B0E554139C4F5038A2F5461A53620431F21409367C60C5A96087A333A5F0530E1A1A2515DB75CA862BA6A39FB7FF02120BBEE1962897CB0C41FE19555EF3FC43362FE5E7A410BF283DD292E6A67DA39F7C57691301679F85DA05E0BF5D54E4BBF525024278564E5B89EB3A4DF51DB2C896761D9CD74A5717815FE6446B06871694D1147D9EB0133F6832D8FD8B6A4DBCEAEC2D9550DBC32DA1FD39E462048D240B4EFD0BCC46982131B6738060DB1D3301BDF6392DF4E3A349B85DDE4D47E1688C98BA1874E33A9DF5E245C90AC398D61E3F29110BFD54AD35F5375A6A4A4F094D93AD44D694DB0CCB9DEC3D5F9DEC3C1EADA124E9DE4D331BDA49C9768E7BA3D6C07908B9A924D3C80ECC46A4B109016765F54B63C01755F203A8D7DDE5C03C4A39B3709F8AE316527A79A5FFABF1C25BB61C15BB4513B351F3A296C41EFFADE9153D6A1DA59AD80B895D88EC4D8B8025A8C8D3F09E48C8DC4DD6799F866B279E9EF4790E58364700B4BA37192D609D957DB7BDCDD6FA3B37B07A6B1D78CDA5593C501B692A9994833D1A715DABBD7A11AED5FC82CDA37FEEBDE951231F48A39D0468CC3D88D27309B3176DB2E55559CD688176ACD3C8C8047BD8088A8FEAD3BE4006792C9186D094C8339B27778ECDF6C66A480CE6CED62E3F0B6A4B777DD8F0D1272F737E2523ACC9EE9240B2AEA31430CBB152F924CF5611ECCE7A24A4F4B47EFC7DEB7655C1E62B66BAFD9182B6EFD43FD35960199DB36'
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
