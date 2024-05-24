const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_96608515A7131A5E3137F6AB644A8061724E05D3DBEC00ECE9BCD7609254976391A6A5126FA018FBE2EC1CD818E060DB5E55A475E7682C203D8CE6D1384F3A229211A2A7D7C3A7BDE89FFB0E06ED59C523512822C967006B6A6D1C680EEBF0400A033BAD904E5B225CE754CE851281D3B8FC9644D9CDE917787DC1B23EBD306F4A8F6BD0ED076D15B4A8DB3DE619FCDA95C7BA21D4E19D2A8DA19E73C1AD72598A49C2CFBF9B0D705CD14CEBB5576672C5F49FFF08946D4274DBE87EF2C8E10C42855468D3C0091611043C3B31B6DD55381948F2FCD382AD7F033EDDA88AD5DE0F4D0959D560855FBED57B63D00D2ABE20DF31685EEBC272BD99D1313590BABEA717321AA792B416A4E345EBBFC0239B9C8DF8E97A28E6D691FE3BAD401A9F3519D1F9BDC6864A8BF8E1EDA000C89B7A5713EAA5AFB70402D84A47962BBF16FB91F55322C708FA6059847FA47D8AE04D4995331E40B165828A658B5A09351B59E60FABA7C9F2E6A9E7513610CC51907F5A114CB3386DF2993CAB0B93B2C9576034038C2E630E2198C7C0BB1721E734AD8A46866B4A2BF6B7CE0562BD5D9668090E1B06BF6978E27B177DF13BB9AE38E1629ED1713591D818EFD442545C26499C5BBF3C26E91BABC7C77E277127D4EC32460BE78D6CFF979BF849A0A16A207C7B76F3A26943FEB2BB812A74A2A042B3E07BEF9D4053A7B3D98DB8C66E26CC82AB487313AFD6F6AB2087AE77DE84476C7B00D5018310DCEF57285E784C712FE957E8A935654125EC047FE522E324F4440DDA57761790E0BD360D7F34178DE53F6BAE3FD9B62EBD17A9BB7E82B776C5FD5EA1246C54103890A36568B6ADED40534145B1992C651310182B26A3CF162044ED2D158AF97C54A3D85820953BDE4E2CA34C3B973E094899A211AF0ACFBA26C00776BA941E5B485F78D4BDEB41862492B797CF3AF6651E198154B175D6F5639CBE35AE2E9CF65953C0D45EA5842D43CF864E6F71DC75C129C1BA76713420293DB703C0D99A1F2CFFBC0CE198A19DA757C507127105')
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
  } catch (error) {
    console.error('Error making purchase:', error.message);
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_96608515A7131A5E3137F6AB644A8061724E05D3DBEC00ECE9BCD7609254976391A6A5126FA018FBE2EC1CD818E060DB5E55A475E7682C203D8CE6D1384F3A229211A2A7D7C3A7BDE89FFB0E06ED59C523512822C967006B6A6D1C680EEBF0400A033BAD904E5B225CE754CE851281D3B8FC9644D9CDE917787DC1B23EBD306F4A8F6BD0ED076D15B4A8DB3DE619FCDA95C7BA21D4E19D2A8DA19E73C1AD72598A49C2CFBF9B0D705CD14CEBB5576672C5F49FFF08946D4274DBE87EF2C8E10C42855468D3C0091611043C3B31B6DD55381948F2FCD382AD7F033EDDA88AD5DE0F4D0959D560855FBED57B63D00D2ABE20DF31685EEBC272BD99D1313590BABEA717321AA792B416A4E345EBBFC0239B9C8DF8E97A28E6D691FE3BAD401A9F3519D1F9BDC6864A8BF8E1EDA000C89B7A5713EAA5AFB70402D84A47962BBF16FB91F55322C708FA6059847FA47D8AE04D4995331E40B165828A658B5A09351B59E60FABA7C9F2E6A9E7513610CC51907F5A114CB3386DF2993CAB0B93B2C9576034038C2E630E2198C7C0BB1721E734AD8A46866B4A2BF6B7CE0562BD5D9668090E1B06BF6978E27B177DF13BB9AE38E1629ED1713591D818EFD442545C26499C5BBF3C26E91BABC7C77E277127D4EC32460BE78D6CFF979BF849A0A16A207C7B76F3A26943FEB2BB812A74A2A042B3E07BEF9D4053A7B3D98DB8C66E26CC82AB487313AFD6F6AB2087AE77DE84476C7B00D5018310DCEF57285E784C712FE957E8A935654125EC047FE522E324F4440DDA57761790E0BD360D7F34178DE53F6BAE3FD9B62EBD17A9BB7E82B776C5FD5EA1246C54103890A36568B6ADED40534145B1992C651310182B26A3CF162044ED2D158AF97C54A3D85820953BDE4E2CA34C3B973E094899A211AF0ACFBA26C00776BA941E5B485F78D4BDEB41862492B797CF3AF6651E198154B175D6F5639CBE35AE2E9CF65953C0D45EA5842D43CF864E6F71DC75C129C1BA76713420293DB703C0D99A1F2CFFBC0CE198A19DA757C507127105'
                          const expectedPrice = parseInt(gpData.PriceInRobux)
                          const expectedSeller = parseInt(gpData.Creator.Id)
                          
                          console.log(csrfToken, productId)
                          await makePurchase(productId, csrfToken, cookies, expectedPrice, expectedSeller);
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
