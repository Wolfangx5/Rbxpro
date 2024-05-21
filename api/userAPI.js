const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_2C8D6E049B1D6BD1710AE1B506E0E8F06B1F469D7A61C1BAE3F368E03757C382D61CB5E3C6550A9FDBD277FBD1A7158594E1D4790EDEF06A50ED3B955F4063AB4BC47EAB1BE66C78EC76C86FF33DE094570DB9460207FA5C676A736998790A651D545D18B2458B3BF2B9F3483F0B826EEBD85867CEB29C26A4693F2D235C8E96F152756B09CFCBB31B912B296A6E2BF452EE70F0A5D884516E9B0421EC9C2BDE5AF567A702D350CAA0CD1FAAFCC628674FCE023EC9C5886134179B122E7734EED84326B7FA9ED45C5FAE175D603EDDBF7E1F6A390FA96B16E0DD6F6D31D87C20153B4FE55ACDD5FB253D149FA85EB12B288977A47071A1AD4D96BBA7C370CF3CA48A1BCC549FC6FD36BF713EF32F61B20B0AB368E8A6A1FEFACEF8E0E33B3E2EE6BE8EAE75A6ABC4481E765CE698A107FE5FFA108299288D7BC27866A9706D01460005CF68CE7AD87751E5B7BD44AAC7779D88A3BE7A0D7156D7B0F8DB9060D4FDC28E31D7E0D426EF8E59F8D60132BCEC834A9AA2DCDB8E8733E52DEDC5A91878D4A3D2C3F5825A24D3A7D928605F30FE949C9C1DB94FC596F889C97FEAF28A40A5C2067BFCBF17458160CD11B4FDB6AAEF23FAB9CF65E847CFD322FC837F9D535F621964473ADBD891E4342CE07B31117C85BAA040624F97544500223CF7CFF1BC697C49260FB306DC85CEFB70D9FC9350BB347FE42493121BE6E07841C4467AFE7EE52C0875DA79EB530B9E88C01FB0D105E591EE9DB6754DEDE9FCFD419E3E7C50862C5FB41C4408ABCEA067B55A5B3CF6BB137B6473455BC3E8DB907E04E2C07A072B0E2965FC3B55FCD7DA8F00BF20AB38E79E1DB26FE018B5984FBE029EFC9DD99FE4367F76B799FEAFA5AF661A040B3C97CA25325E4475FCBA8BCE9F5B72F2BDF4DE0DEA5ABA4E8828A01057A2D7AAFDC49A90C253B53D5D4A25051224D6102A65FA92D4451B4B58FE50EA8F1CD4F3D16F96E43564CA892D0E85F50D6C96AEDF05B5050AFE38D400D64A349A7B575EC2FB1C891D7DBF18D2B283D1025DA3B9C5')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_2C8D6E049B1D6BD1710AE1B506E0E8F06B1F469D7A61C1BAE3F368E03757C382D61CB5E3C6550A9FDBD277FBD1A7158594E1D4790EDEF06A50ED3B955F4063AB4BC47EAB1BE66C78EC76C86FF33DE094570DB9460207FA5C676A736998790A651D545D18B2458B3BF2B9F3483F0B826EEBD85867CEB29C26A4693F2D235C8E96F152756B09CFCBB31B912B296A6E2BF452EE70F0A5D884516E9B0421EC9C2BDE5AF567A702D350CAA0CD1FAAFCC628674FCE023EC9C5886134179B122E7734EED84326B7FA9ED45C5FAE175D603EDDBF7E1F6A390FA96B16E0DD6F6D31D87C20153B4FE55ACDD5FB253D149FA85EB12B288977A47071A1AD4D96BBA7C370CF3CA48A1BCC549FC6FD36BF713EF32F61B20B0AB368E8A6A1FEFACEF8E0E33B3E2EE6BE8EAE75A6ABC4481E765CE698A107FE5FFA108299288D7BC27866A9706D01460005CF68CE7AD87751E5B7BD44AAC7779D88A3BE7A0D7156D7B0F8DB9060D4FDC28E31D7E0D426EF8E59F8D60132BCEC834A9AA2DCDB8E8733E52DEDC5A91878D4A3D2C3F5825A24D3A7D928605F30FE949C9C1DB94FC596F889C97FEAF28A40A5C2067BFCBF17458160CD11B4FDB6AAEF23FAB9CF65E847CFD322FC837F9D535F621964473ADBD891E4342CE07B31117C85BAA040624F97544500223CF7CFF1BC697C49260FB306DC85CEFB70D9FC9350BB347FE42493121BE6E07841C4467AFE7EE52C0875DA79EB530B9E88C01FB0D105E591EE9DB6754DEDE9FCFD419E3E7C50862C5FB41C4408ABCEA067B55A5B3CF6BB137B6473455BC3E8DB907E04E2C07A072B0E2965FC3B55FCD7DA8F00BF20AB38E79E1DB26FE018B5984FBE029EFC9DD99FE4367F76B799FEAFA5AF661A040B3C97CA25325E4475FCBA8BCE9F5B72F2BDF4DE0DEA5ABA4E8828A01057A2D7AAFDC49A90C253B53D5D4A25051224D6102A65FA92D4451B4B58FE50EA8F1CD4F3D16F96E43564CA892D0E85F50D6C96AEDF05B5050AFE38D400D64A349A7B575EC2FB1C891D7DBF18D2B283D1025DA3B9C5'
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
