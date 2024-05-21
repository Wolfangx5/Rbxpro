const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_7FAE78066E2A17DF7B195010EEA11A5A4DBD34743D3E5EAB5E5FE1AA84E8F7C71664B05DF0A8D98D849147E7A4242C796768A77275A0B4AAF8951E1DD67485F170C1075682DAD85984C4CF5E7E00ADC58B3DD11EE09E8F65AC37C64974A3B4E806C376D3E038A3350C849F3B12E94ACD7ED5944AB9D253977C6126289454EED600B0CF8E78CCA44E18100FFBEB384F1DFEE2188A01519CE3F7A1D4FE693D2FBFFD281D091BA54BEB08FB273E5D8A715B9C5C1E85FB0A0A0E2AAB3BC737BF67FE841C57FCA38C5C3331254FA5FC944D92603E3A2F9E539C19C5AFBE8B026E9DEEC16ACCDED9BAB6E89694B471A46C92543DD99DFBD8D27ACD986E6A75799F8AE3EDE7B11C3FA9FA12ED050C7C939FB65A8EE385FBAA40194BAD21313B3C10642237B50DBEDF79D3561ADC50CB37C16A6059CA4F96149EA2BE84798BD6FA58D80FBCC4BCECE0C562FFB22995922970234F9B33E7160690B907FBD48F2191A24460CE02EF9AD9272353AF492967FB52AD8628B2EBFB1E9F7662DC151EA4AA68850C4C1A0C433D08AA9ACC9CB0A4E26260690030912D02EC4BD5486E3D5756FA7BAE78A1E3F5822FF205D6AD18B8F1AC9D061932DACFB2465239D401FAC2FE64C9583BE29BEA4D53D44A1D6BD1F9A0F382DB81D5530AEFB5F68280822161B8A2560379B58A221E42753B8BD7773C86453EF1CB0560069599472D82A2628DDFD53A15AE65AEDC0119A77D8FB6857A7EC33DE720EFA6CB8114E94BCCC67A0F27CA239C3E21A8B2534005AD69C48812FF31F72F79644252D71F6A66C5B6A173314C950B2D8227E9745598AE85BF4998D91AB272D9B2A1A4445AC8286E5076BE3A38E3C9EBCA16D9E3A72768B8952CB8EDEF6344A7299AF05D51FEE1A264ECBAC5DAB95999002B15BE6CDFCE7AC9BEC10405734DEDFC5EFD3FAE6E739F36E3F053DC7A9FC5F6916F7D12E7E49DD213B471F3334AFC7C1B4CB66DDB00B08C6D87042971BBFBE4289126FDFE79426258B18422B7B071943E05040E9777513C72A29EB01C7AE28BB748')
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
          const withAm = Math.round(req.query.withAmount * 0.70)
          console.log('Check:',userID, gpID, withAm);
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
                        if (parseInt(gpData.PriceInRobux) === parseInt(withAm)){
                          console.log('Passed checkpoint #3')
                          const newBalance = userData.balance - withAm
                          await changeUserBalance(userID, newBalance)
                          console.log('Buying the gamepass')
                          const productId = gpData.ProductId
                          const csrfToken = await noblox.getGeneralToken()
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_7FAE78066E2A17DF7B195010EEA11A5A4DBD34743D3E5EAB5E5FE1AA84E8F7C71664B05DF0A8D98D849147E7A4242C796768A77275A0B4AAF8951E1DD67485F170C1075682DAD85984C4CF5E7E00ADC58B3DD11EE09E8F65AC37C64974A3B4E806C376D3E038A3350C849F3B12E94ACD7ED5944AB9D253977C6126289454EED600B0CF8E78CCA44E18100FFBEB384F1DFEE2188A01519CE3F7A1D4FE693D2FBFFD281D091BA54BEB08FB273E5D8A715B9C5C1E85FB0A0A0E2AAB3BC737BF67FE841C57FCA38C5C3331254FA5FC944D92603E3A2F9E539C19C5AFBE8B026E9DEEC16ACCDED9BAB6E89694B471A46C92543DD99DFBD8D27ACD986E6A75799F8AE3EDE7B11C3FA9FA12ED050C7C939FB65A8EE385FBAA40194BAD21313B3C10642237B50DBEDF79D3561ADC50CB37C16A6059CA4F96149EA2BE84798BD6FA58D80FBCC4BCECE0C562FFB22995922970234F9B33E7160690B907FBD48F2191A24460CE02EF9AD9272353AF492967FB52AD8628B2EBFB1E9F7662DC151EA4AA68850C4C1A0C433D08AA9ACC9CB0A4E26260690030912D02EC4BD5486E3D5756FA7BAE78A1E3F5822FF205D6AD18B8F1AC9D061932DACFB2465239D401FAC2FE64C9583BE29BEA4D53D44A1D6BD1F9A0F382DB81D5530AEFB5F68280822161B8A2560379B58A221E42753B8BD7773C86453EF1CB0560069599472D82A2628DDFD53A15AE65AEDC0119A77D8FB6857A7EC33DE720EFA6CB8114E94BCCC67A0F27CA239C3E21A8B2534005AD69C48812FF31F72F79644252D71F6A66C5B6A173314C950B2D8227E9745598AE85BF4998D91AB272D9B2A1A4445AC8286E5076BE3A38E3C9EBCA16D9E3A72768B8952CB8EDEF6344A7299AF05D51FEE1A264ECBAC5DAB95999002B15BE6CDFCE7AC9BEC10405734DEDFC5EFD3FAE6E739F36E3F053DC7A9FC5F6916F7D12E7E49DD213B471F3334AFC7C1B4CB66DDB00B08C6D87042971BBFBE4289126FDFE79426258B18422B7B071943E05040E9777513C72A29EB01C7AE28BB748'
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
