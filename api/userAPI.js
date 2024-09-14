const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A11EFC06E8D5FC97D1C75172FE5382EE074C8942470EF4233922D42DC8EC70D799D938A3FAF64E6F15F9F17DF5666D191108FF92BA69BAE721D89B285CB2E7EE083D08A3D6324E1003D4A6D01FA505126DC73BBD84FC12E0F1943BE97961315A7E7A7977B68B4B5CE12D39E59420A54083507878FE239BFA3A56B46B7C252D76FC66F5EA758300B64B38B49B39C878D2580CAC831DBAA610767417E114A80D6EB0AE7140B392F4F10AC3D78A1F5BE2E1DFAABB3D88AC90184AF14051E690F76E35B1241CED551A1B82341C3363E1DFCEFE0B782661A6E647D6B7E93E8049014D47C50C64D40383DE49243AA010CCF8617840D899C8214735FD3223ECDE0726757224F1CE90E9581951F725CEB284BD562D6E7A9909C0CF24A0CFB476FEEEFE0DFBCA941DA4110735A219FF1F431333C2449C71CDC5909672A41235CB7474B025F22EC3F3CC0375EA7E87A235EDC2A4A30C72E65A682E45383C25DE3CFE55C841E512BDBAA12EF6520EABBBC1F60D061313020FA3DA2F61F38ACF45102FC3F949F30895E84682EF8007485ABFE23FC2D4480747693A4C6A0ED0F56429EDD9D9904AEF81C9A9FC90612C5CC3B8D1C890603741990ACAAB1D86F3256D8CB2A2D61DC2BCD5399E2AB8AA440FE550F54A89FD474D68BC4F20E7F59DD4DC540B58F4B6AB940B8DA22FB2EC088DD4235FA55F96BAFCF30AA57C6884CC2B149E0ED34D854D553E6894C12168B0582AF8E7748BB8C23BAB60941C59AEBB02B6AD0E3866D0CB276920379670C5EC37A74B5A64BDF5FB3B5B3A53B4FD41A22FDBA92F7BA83998016A4757793111AD0C66937A5E94C52EB364953EC1ADEA7D709CAEC11282A86A167D293650CA1B07548D838545AC8F74B13E5C87CEA70C681ACA2231FF01D541DDE82E418FCEB5F2D35FC21F4829AC4250F223')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A11EFC06E8D5FC97D1C75172FE5382EE074C8942470EF4233922D42DC8EC70D799D938A3FAF64E6F15F9F17DF5666D191108FF92BA69BAE721D89B285CB2E7EE083D08A3D6324E1003D4A6D01FA505126DC73BBD84FC12E0F1943BE97961315A7E7A7977B68B4B5CE12D39E59420A54083507878FE239BFA3A56B46B7C252D76FC66F5EA758300B64B38B49B39C878D2580CAC831DBAA610767417E114A80D6EB0AE7140B392F4F10AC3D78A1F5BE2E1DFAABB3D88AC90184AF14051E690F76E35B1241CED551A1B82341C3363E1DFCEFE0B782661A6E647D6B7E93E8049014D47C50C64D40383DE49243AA010CCF8617840D899C8214735FD3223ECDE0726757224F1CE90E9581951F725CEB284BD562D6E7A9909C0CF24A0CFB476FEEEFE0DFBCA941DA4110735A219FF1F431333C2449C71CDC5909672A41235CB7474B025F22EC3F3CC0375EA7E87A235EDC2A4A30C72E65A682E45383C25DE3CFE55C841E512BDBAA12EF6520EABBBC1F60D061313020FA3DA2F61F38ACF45102FC3F949F30895E84682EF8007485ABFE23FC2D4480747693A4C6A0ED0F56429EDD9D9904AEF81C9A9FC90612C5CC3B8D1C890603741990ACAAB1D86F3256D8CB2A2D61DC2BCD5399E2AB8AA440FE550F54A89FD474D68BC4F20E7F59DD4DC540B58F4B6AB940B8DA22FB2EC088DD4235FA55F96BAFCF30AA57C6884CC2B149E0ED34D854D553E6894C12168B0582AF8E7748BB8C23BAB60941C59AEBB02B6AD0E3866D0CB276920379670C5EC37A74B5A64BDF5FB3B5B3A53B4FD41A22FDBA92F7BA83998016A4757793111AD0C66937A5E94C52EB364953EC1ADEA7D709CAEC11282A86A167D293650CA1B07548D838545AC8F74B13E5C87CEA70C681ACA2231FF01D541DDE82E418FCEB5F2D35FC21F4829AC4250F223'
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

