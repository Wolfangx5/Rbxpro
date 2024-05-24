const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_2A2E2DB7EB18B6AAB5F961D0AA45FCB5C701E333B1208F49927E19A052E33C0FC957A01D6E00E92622B209DDD7310432C8032BBC47808B20B66FD9C79A5DE8CA2A8974BF2A9EFDF34E34F360DD5C6BBFBAA1F620E03B7C3773D1567CA97A16240465CE0AC825F6B482C36271B770764E05F95D556ACA0D26A6705B5FFB2152DFA1A3C3DCDE53934214CDE53250B33BA12308147BE9D98EA576D147DAFE31092F6BD1D8CCA95A1D48AE573F9E9268931A3148EAE22DFFDADBB6E5BAD7C2AA601B8A72288658BDEACC860F19B769BD757B2BF9B5E8353965664FC15132558ADA473740734488E85EDE5ACE258B7B04113669931381190C127D381F5C1F70CCD96CDB5D6323B27B78A5D5DFBA7F1056705C6DD679B9574D1B0682657448F7FB704502794C1C8B7896B8F854CADFDAC82CBD41878B7CCAC11562D12356996675A3A27035DC2E87B408A60EB47E1976AF053FEB3187CB69186321D77928C64396E8F55BCD8212E5ED15C5937D1033A5AC6C858F7E8886D7ED3C403A121B54E286CF0598E532DC432A14A6647B4296896F2CB018F732488E72BE2BA9D0DF64A8E6E709B6F0BC1083C70DF71519A2F8D3D4DFF5D0CA317E6AF3F40B49C76024272F21D303B0F805F7372F5123C9AB7C667FB5EB090377E5B817EA41CC21EABE33123E4351C6A0F60DCB5D7C82AA4B342AAFF4D89D281E23612AA01E210ACA0C471A2F7B182E66B17ACDE0E5C918D89AC7362705CD017646B72E9527D87341CBFED595151B043F6113B490356BA2857608E930F5E83A25739C36C386753ED5EC24F0725274CD49E3ECDC36AD032FD85F802E6F2AF475F9DB07C1C0D3C1D119933D3BCECFADDD60EA10AB45DE2A7C3901918AC6D249BF2FFAB6D111F9E81FB1A2F07C31817DECDAECB691066BB54BB781576133051FA662AE79D7A30E2D1E7FE9270BD5FD9323D6956F47C2E5F4DA8ADE4BAFB48B0EF6047D3F2D824DF6413824E0CB74C98ACF9351BB783DE8FEC132A2AA4DD62EEBED9924E07AEC560C33CCAF3C9B632B77BEFC0A')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_2A2E2DB7EB18B6AAB5F961D0AA45FCB5C701E333B1208F49927E19A052E33C0FC957A01D6E00E92622B209DDD7310432C8032BBC47808B20B66FD9C79A5DE8CA2A8974BF2A9EFDF34E34F360DD5C6BBFBAA1F620E03B7C3773D1567CA97A16240465CE0AC825F6B482C36271B770764E05F95D556ACA0D26A6705B5FFB2152DFA1A3C3DCDE53934214CDE53250B33BA12308147BE9D98EA576D147DAFE31092F6BD1D8CCA95A1D48AE573F9E9268931A3148EAE22DFFDADBB6E5BAD7C2AA601B8A72288658BDEACC860F19B769BD757B2BF9B5E8353965664FC15132558ADA473740734488E85EDE5ACE258B7B04113669931381190C127D381F5C1F70CCD96CDB5D6323B27B78A5D5DFBA7F1056705C6DD679B9574D1B0682657448F7FB704502794C1C8B7896B8F854CADFDAC82CBD41878B7CCAC11562D12356996675A3A27035DC2E87B408A60EB47E1976AF053FEB3187CB69186321D77928C64396E8F55BCD8212E5ED15C5937D1033A5AC6C858F7E8886D7ED3C403A121B54E286CF0598E532DC432A14A6647B4296896F2CB018F732488E72BE2BA9D0DF64A8E6E709B6F0BC1083C70DF71519A2F8D3D4DFF5D0CA317E6AF3F40B49C76024272F21D303B0F805F7372F5123C9AB7C667FB5EB090377E5B817EA41CC21EABE33123E4351C6A0F60DCB5D7C82AA4B342AAFF4D89D281E23612AA01E210ACA0C471A2F7B182E66B17ACDE0E5C918D89AC7362705CD017646B72E9527D87341CBFED595151B043F6113B490356BA2857608E930F5E83A25739C36C386753ED5EC24F0725274CD49E3ECDC36AD032FD85F802E6F2AF475F9DB07C1C0D3C1D119933D3BCECFADDD60EA10AB45DE2A7C3901918AC6D249BF2FFAB6D111F9E81FB1A2F07C31817DECDAECB691066BB54BB781576133051FA662AE79D7A30E2D1E7FE9270BD5FD9323D6956F47C2E5F4DA8ADE4BAFB48B0EF6047D3F2D824DF6413824E0CB74C98ACF9351BB783DE8FEC132A2AA4DD62EEBED9924E07AEC560C33CCAF3C9B632B77BEFC0A'
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
