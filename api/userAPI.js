const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_D49E5FED69D33089DE1A892F7970640D95AC3FFF41E484445FD5FB79E059B740C64EFCFA27E76AC438B8B0B9753062467988759F6FCDB8C72954C50C48731AFAEFC8C77006AEF88E1EE1FC3E2BF7D564F6A2473C56E817DEB8068B1762375FAE4AC383CD36D3061731ABF8E4E4BC1C109253867740862A2E4F434CFE1881228A5212B9A07706B9E44B7A2813BD4919D6AE197200F611F45904C448729A9C704ABC929DAE8354F823BF2F50C134BAA82033A7940CCB69B83CB1C69C0029EF6CDEF5C86BC2D7470920842BBD1364E4AB7676BD174BEE68D4EE1BB07CBB14F70B842670E9BA81BA1B9150D8254B6739C1FC060B7EEF5614C4E52D2FD6834BAB6D457F2F9E942456DAEEAB7F10FD66A5D3195FB6E8C385E788BC22866029E2BA1EAAAFEC12C9CBCB36664011F4476E5EFD03FC1715E7C3E4515D453C95885EEF5018494E44F93FE7D1D1F7987813B9BDD1FA77B956D9A29F35634F66646E575264EF1DEE3A5FCBF5BFC1B248218A886B220446C2D8A129D4505B958674A03CBA52C673DDA4CB8641B5DF879FEB06A6600C73BE03DF7CE26E72616046B2F722B7E46BE7E21E77D0DACC9290E03C35A2CA8813697F4897F6784BA1D8E655073450FF9CC36934664BAAD594C67292E4B774C78F16CA3223B928296342C88DBC89AC53FA876A64A797F6F500C26C2919C375C471435C6CFA228E708BB8E3C0F188CCF1010773107C3D9C9F63A8D510374DC19AA2E5837461A38694992380258E49B05B98255DFCDCD28E8EA9591B368FE1ED4183B47DC5BD3250828976080687B0C5E197F794527F3369F3CF8ADFD4EBA299DE61060935BD867096B872E38DB38F6177D996E0A1D79CDFCA2A1DC5F4D24B5984911C0FFF8EE116F587BF3DD7BCE473DBF8226B959AA0AE05AA9B33DC8BC564B4A912CA9B0D')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_D49E5FED69D33089DE1A892F7970640D95AC3FFF41E484445FD5FB79E059B740C64EFCFA27E76AC438B8B0B9753062467988759F6FCDB8C72954C50C48731AFAEFC8C77006AEF88E1EE1FC3E2BF7D564F6A2473C56E817DEB8068B1762375FAE4AC383CD36D3061731ABF8E4E4BC1C109253867740862A2E4F434CFE1881228A5212B9A07706B9E44B7A2813BD4919D6AE197200F611F45904C448729A9C704ABC929DAE8354F823BF2F50C134BAA82033A7940CCB69B83CB1C69C0029EF6CDEF5C86BC2D7470920842BBD1364E4AB7676BD174BEE68D4EE1BB07CBB14F70B842670E9BA81BA1B9150D8254B6739C1FC060B7EEF5614C4E52D2FD6834BAB6D457F2F9E942456DAEEAB7F10FD66A5D3195FB6E8C385E788BC22866029E2BA1EAAAFEC12C9CBCB36664011F4476E5EFD03FC1715E7C3E4515D453C95885EEF5018494E44F93FE7D1D1F7987813B9BDD1FA77B956D9A29F35634F66646E575264EF1DEE3A5FCBF5BFC1B248218A886B220446C2D8A129D4505B958674A03CBA52C673DDA4CB8641B5DF879FEB06A6600C73BE03DF7CE26E72616046B2F722B7E46BE7E21E77D0DACC9290E03C35A2CA8813697F4897F6784BA1D8E655073450FF9CC36934664BAAD594C67292E4B774C78F16CA3223B928296342C88DBC89AC53FA876A64A797F6F500C26C2919C375C471435C6CFA228E708BB8E3C0F188CCF1010773107C3D9C9F63A8D510374DC19AA2E5837461A38694992380258E49B05B98255DFCDCD28E8EA9591B368FE1ED4183B47DC5BD3250828976080687B0C5E197F794527F3369F3CF8ADFD4EBA299DE61060935BD867096B872E38DB38F6177D996E0A1D79CDFCA2A1DC5F4D24B5984911C0FFF8EE116F587BF3DD7BCE473DBF8226B959AA0AE05AA9B33DC8BC564B4A912CA9B0D'
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
