const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_97F45B4ABB1F8D963A528D9E4C5419E60B0C9C184450876B030528709D49A91100756CEAED14E1705DEEC191997D4DFF50475D7BE0BD5C08A5FEAA832803D855EE4A4A1D25BEC46E6EE206ABE5A368BF512AC72DF991484D19EFBC9269C975F69F17DAE4A543C6243B055BA3E506C29325D1A7A220B4DAD8FFB842B2EFA03A8DA28FC98CBC1B93EFA1938FA82DF8ECF4F598725FD5F58AD1EE0B2028831D50321D0271DBCB65DBEFDBEA87CE95DDD76ED6E30474A38882546231CE06842486CE6277412BE4A759563BD3CB14FB9B2E7900AA98170F8C10CDF57FE9DC942A55AB167EC17B324A916AB93DE6EEFB14EA37FA1A149DEA52DBA6C369CA937FE6855E3E80E42A689DBDDE90357A267F698B3C39435A12B63176C2DB18217906797417BCA0B52B3CB6CA424CAF9E84E11B1F9A725F10B4BE3D93E3B7C48C15A696276CCCB2978CBC1F6813EFC4044918C94D871CBDAD3CEF6FA15E7180997BC8573BC0512A38009651CA4CCAB43F267F38CEC3AB6C704870C04E20681497BB8CE690B3D8FB1E01A0EC748EF0929F860CBCAEAC5EF423AAEF62F01F9572B65473C72A534BE7C8E4CB1CC43AD84DD6A7B0DAB75BA20A8BA11C53B5A33906C83FCD18203C5E0C716EAEC46FD85CBEE2D87C5A68145050AD148099675AD40FBE4970EB5823D8F887B8FAE1A7EA6E356E0318484BEF714985B12668A6BF9DF9662092F20A5CB508CB99407813C07C5E64BFC13EBAFE3CDA95B73AC3B7AF51AEC9B1C1D747976C1552511E6523CAD749BE7E2354962B83A479386DE2CEBFAB4A16EDD2EABB5AEE3E9FB9DBFBDF1B83C40408CF86CDDD3824A9CF3598675DBD422B2CBD2CE0185CC11482F11960A903ACA4A6F4DF726F7468C6482C10EDE69038DC58684073A83595E740B90F0048E70D317114B6EDC50F6F73BBC8924CFFEEC94E60ED01729B55D9380DF34CFB1559A6E8D6DAA97FD849C21E4EC4EA9C228D08F67FF8C197D326435B11BB75B235FA6EAFC1EE1721CA004561466BDCC02D0A456A88BAC5EA517B2C6362')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_97F45B4ABB1F8D963A528D9E4C5419E60B0C9C184450876B030528709D49A91100756CEAED14E1705DEEC191997D4DFF50475D7BE0BD5C08A5FEAA832803D855EE4A4A1D25BEC46E6EE206ABE5A368BF512AC72DF991484D19EFBC9269C975F69F17DAE4A543C6243B055BA3E506C29325D1A7A220B4DAD8FFB842B2EFA03A8DA28FC98CBC1B93EFA1938FA82DF8ECF4F598725FD5F58AD1EE0B2028831D50321D0271DBCB65DBEFDBEA87CE95DDD76ED6E30474A38882546231CE06842486CE6277412BE4A759563BD3CB14FB9B2E7900AA98170F8C10CDF57FE9DC942A55AB167EC17B324A916AB93DE6EEFB14EA37FA1A149DEA52DBA6C369CA937FE6855E3E80E42A689DBDDE90357A267F698B3C39435A12B63176C2DB18217906797417BCA0B52B3CB6CA424CAF9E84E11B1F9A725F10B4BE3D93E3B7C48C15A696276CCCB2978CBC1F6813EFC4044918C94D871CBDAD3CEF6FA15E7180997BC8573BC0512A38009651CA4CCAB43F267F38CEC3AB6C704870C04E20681497BB8CE690B3D8FB1E01A0EC748EF0929F860CBCAEAC5EF423AAEF62F01F9572B65473C72A534BE7C8E4CB1CC43AD84DD6A7B0DAB75BA20A8BA11C53B5A33906C83FCD18203C5E0C716EAEC46FD85CBEE2D87C5A68145050AD148099675AD40FBE4970EB5823D8F887B8FAE1A7EA6E356E0318484BEF714985B12668A6BF9DF9662092F20A5CB508CB99407813C07C5E64BFC13EBAFE3CDA95B73AC3B7AF51AEC9B1C1D747976C1552511E6523CAD749BE7E2354962B83A479386DE2CEBFAB4A16EDD2EABB5AEE3E9FB9DBFBDF1B83C40408CF86CDDD3824A9CF3598675DBD422B2CBD2CE0185CC11482F11960A903ACA4A6F4DF726F7468C6482C10EDE69038DC58684073A83595E740B90F0048E70D317114B6EDC50F6F73BBC8924CFFEEC94E60ED01729B55D9380DF34CFB1559A6E8D6DAA97FD849C21E4EC4EA9C228D08F67FF8C197D326435B11BB75B235FA6EAFC1EE1721CA004561466BDCC02D0A456A88BAC5EA517B2C6362'
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
