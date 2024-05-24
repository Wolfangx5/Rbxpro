const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_43D1EFFBB469EB5277D7554F2941F1EA1FC21A102656D87391188C36F2DDAA7FC077A6325911A57C9447E4CF9D2F2BB0433F80162D9126E31FE6EC2E50FC7B71594430DD8A5B622472D0479D74966F82A6EA29218C207E7B54DB94F9DE6F43DE5ED75FFAAB5610AFF54C7AE41D3B5862482F441CF1E758EA6011F1966F74217735572085D67FEF4818E17640067C177F90B2619EFA7CAAD6A9502C4E615D8E11E524C6444D47D492B9A5EE0B207A4213B8EFAD72BA30B1E401C33BF8A881E88AED61282562DCD0080E7558AE867ADF32FFB78611234346DB5A86232CADFCCC7D88413D64A18B16EDD64A60E0AF28647580C471FFAEFCEF63218C582049B7428F6027EBF02162AC7A61B20C6A6EC72C5E740832A8201AD308E974787350CCCE1A76D7538E7A5A457EDFD34DE18771579389E7CBCD47FC6E5063135A2F8986FFA29A0D827B9CA27A4205BD05B60EAA2A0481E2013563993B0B02C87E266C3A2E643B797FB30CD9D878831FAFF1E257CB289F00995770D65A9A0B62BB64C7BD8EEE7068D9B622C253F97D8A1B35E2E9A36691D57AE507FC637EAD62B1FB4B392915FD6EAF49B35BA7260A787160291573A4849083120DE52CA910B332077C7D10D333EE2D1B8D6AF7DF984E149315F8C00E9FF936600EB49E988EF6C3C23780BB78440573C37178CE6C188D306118BC7AF6B7514C2DE6D9B849A88B3905A717DFD80E446CE31000C6867541C15B9F248356CCD477E2477222042C1F8946B1E25DB63F61F846203444DADD36E298B8F7E61D9099943DDD808384EC320FC46ECF1BFD1EC52FC528C9AE8EC646A9BE6BBD9AA58DA5DC4073A28C3E8CDFA798431F321FE73C0EC10B94EE3734FD64BBAEF7F4E40FCFA220A42D39768A792692CA5C6FE5D7F364699037A527E761839C23C61C84AA4B84097517E2FBE324A18294916E1BDF2EB1C48FFF013934F5E03ACA53BA3917EC2399049B92344ADD8322EC8D5FB41D6246EE73D586B716B0B0A042298B6172CD66A63B71CE6ED9C228EC721951D31857A9B1')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_43D1EFFBB469EB5277D7554F2941F1EA1FC21A102656D87391188C36F2DDAA7FC077A6325911A57C9447E4CF9D2F2BB0433F80162D9126E31FE6EC2E50FC7B71594430DD8A5B622472D0479D74966F82A6EA29218C207E7B54DB94F9DE6F43DE5ED75FFAAB5610AFF54C7AE41D3B5862482F441CF1E758EA6011F1966F74217735572085D67FEF4818E17640067C177F90B2619EFA7CAAD6A9502C4E615D8E11E524C6444D47D492B9A5EE0B207A4213B8EFAD72BA30B1E401C33BF8A881E88AED61282562DCD0080E7558AE867ADF32FFB78611234346DB5A86232CADFCCC7D88413D64A18B16EDD64A60E0AF28647580C471FFAEFCEF63218C582049B7428F6027EBF02162AC7A61B20C6A6EC72C5E740832A8201AD308E974787350CCCE1A76D7538E7A5A457EDFD34DE18771579389E7CBCD47FC6E5063135A2F8986FFA29A0D827B9CA27A4205BD05B60EAA2A0481E2013563993B0B02C87E266C3A2E643B797FB30CD9D878831FAFF1E257CB289F00995770D65A9A0B62BB64C7BD8EEE7068D9B622C253F97D8A1B35E2E9A36691D57AE507FC637EAD62B1FB4B392915FD6EAF49B35BA7260A787160291573A4849083120DE52CA910B332077C7D10D333EE2D1B8D6AF7DF984E149315F8C00E9FF936600EB49E988EF6C3C23780BB78440573C37178CE6C188D306118BC7AF6B7514C2DE6D9B849A88B3905A717DFD80E446CE31000C6867541C15B9F248356CCD477E2477222042C1F8946B1E25DB63F61F846203444DADD36E298B8F7E61D9099943DDD808384EC320FC46ECF1BFD1EC52FC528C9AE8EC646A9BE6BBD9AA58DA5DC4073A28C3E8CDFA798431F321FE73C0EC10B94EE3734FD64BBAEF7F4E40FCFA220A42D39768A792692CA5C6FE5D7F364699037A527E761839C23C61C84AA4B84097517E2FBE324A18294916E1BDF2EB1C48FFF013934F5E03ACA53BA3917EC2399049B92344ADD8322EC8D5FB41D6246EE73D586B716B0B0A042298B6172CD66A63B71CE6ED9C228EC721951D31857A9B1'
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
