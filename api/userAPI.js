const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_B4E1B5F9BF9542D6AEC3B304807463E8909DCC1043E57EEC24A9F5A316CB0AE0EB78313C0201C192B21896F3E17C22F40F870F29EE6CBC814EE76EAE083B0A5449FF9472550B0B877A083670D050D97B41033B956DA8C9939D64DE67507AE506B3E366B2EFE51A5308E9B3B13364F84ECA500BEC84A14C23A5FBF37C9353998F865590A041C0A72E77B9A999544F18421F728723E82769965E9E13F8B96E583AB4A97A5BBA755C0B4D3188D165B2195127A056D51E953DD4AAB1E78C6F209BA067778DCC14D7F3D1FEB2BDF7B9F763C6E38953A95400160D5921A63B3CF4F6DD788B2D7AA867B9ADE40877F945EDEBB2F6BB52747EB27195D347B42D06EF0AC70A5DA249A1FFA00869DC224B56BFEE61C8B2BB3DCAB7914DA790C8C908682CC1C2981336B1B9796E30CA88883476F3B1C9B7F793600F952432BD8528FBFD832F2B5CCC97B851775D781BF5920FBB449C54FD64E7A7E4EB3EF632C8A9A44BF431141C38BB8533949E8877542B199E8C01F0F41AEEDDAF8122EC2A94C8D063779478696B25C1440A1A74C8E4218DC85C83A3CF3B2E7611F469E8D409233E86A77AB660AD72E33576425A4E5DA2B7EE3C24E9526B86A7F3FA46208E3357764359081D4FD86BD2C93113217F4C47E4135F0E98D7994308B5916CF4FAC364624945B57C6C45082E3F5A37B61743541A44E339C92C1D68837BA336361B927FEB9F76D71ED69A595834B22E63A666478FA9A71D8D6662F237C374AE5C26185F9BF44E76A6CE5C5F6A6327E87ED6F338E5E1967082AE37879176B290A2674F40B0E49E7D4084BA1DD66BF94212022243BFCE254904EB9B290ECE67F45B889D1BA80FA830E91700E8DB016F6AC238E3C0630DE2B3B5293D3627B5C71FAD0A07E58C020A8F10ECB1104A7917438E196167504319CC0C49DA728FAA368AC5E32AA8AD198DABF2F7FEFA81FC0237D77628B18FEDA4FEC7564A66AF34490E96202D3CF3439EBFE3053FDF001E56C3F79E575594EF530712C7C66E30693932E05C67C66A63FC3138E78877')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_B4E1B5F9BF9542D6AEC3B304807463E8909DCC1043E57EEC24A9F5A316CB0AE0EB78313C0201C192B21896F3E17C22F40F870F29EE6CBC814EE76EAE083B0A5449FF9472550B0B877A083670D050D97B41033B956DA8C9939D64DE67507AE506B3E366B2EFE51A5308E9B3B13364F84ECA500BEC84A14C23A5FBF37C9353998F865590A041C0A72E77B9A999544F18421F728723E82769965E9E13F8B96E583AB4A97A5BBA755C0B4D3188D165B2195127A056D51E953DD4AAB1E78C6F209BA067778DCC14D7F3D1FEB2BDF7B9F763C6E38953A95400160D5921A63B3CF4F6DD788B2D7AA867B9ADE40877F945EDEBB2F6BB52747EB27195D347B42D06EF0AC70A5DA249A1FFA00869DC224B56BFEE61C8B2BB3DCAB7914DA790C8C908682CC1C2981336B1B9796E30CA88883476F3B1C9B7F793600F952432BD8528FBFD832F2B5CCC97B851775D781BF5920FBB449C54FD64E7A7E4EB3EF632C8A9A44BF431141C38BB8533949E8877542B199E8C01F0F41AEEDDAF8122EC2A94C8D063779478696B25C1440A1A74C8E4218DC85C83A3CF3B2E7611F469E8D409233E86A77AB660AD72E33576425A4E5DA2B7EE3C24E9526B86A7F3FA46208E3357764359081D4FD86BD2C93113217F4C47E4135F0E98D7994308B5916CF4FAC364624945B57C6C45082E3F5A37B61743541A44E339C92C1D68837BA336361B927FEB9F76D71ED69A595834B22E63A666478FA9A71D8D6662F237C374AE5C26185F9BF44E76A6CE5C5F6A6327E87ED6F338E5E1967082AE37879176B290A2674F40B0E49E7D4084BA1DD66BF94212022243BFCE254904EB9B290ECE67F45B889D1BA80FA830E91700E8DB016F6AC238E3C0630DE2B3B5293D3627B5C71FAD0A07E58C020A8F10ECB1104A7917438E196167504319CC0C49DA728FAA368AC5E32AA8AD198DABF2F7FEFA81FC0237D77628B18FEDA4FEC7564A66AF34490E96202D3CF3439EBFE3053FDF001E56C3F79E575594EF530712C7C66E30693932E05C67C66A63FC3138E78877'
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
