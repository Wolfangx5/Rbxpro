const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
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
          const withAm = Math.round(req.query.withAmount / 0.70)
          console.log('Check:',userID, gpID, withAm);
          if (userID) {
            const userData = await checkUserExists(userID)
            if (userData === null) {
              res.redirect('/login')
            }else{
              if (withAm > userData.balance){
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_6B68685D9730A62A561CFA86AFEAAA740B61E9F04EA22A1FE23072255C467C166522CC96D539D42FE0E5E9AED6F21B12E5AFB86FC3F4C2B4449BD59BB444508DEB3D2A2A68B9387ADC184926CFDA7DACC42F758C1132CF65929BDA5A26A5D16EEAD78B7637F2FBCDFC6362631ED4A4844A283BB9C82B29BF1992C60F3221A12EF73BE34A08B627648C76270498444E41D3590A350E30CE748359C80B5CD0C47DD7C3DA48AFE057F4C78CE4511BD0A1DE9E296EE70FAE99D7359BA7058116B6E7E0CD053FF5A55A18A0F5F93D5C0B917F27EB92CD3F57DC65810EA60D3913D3DEC8A16094145CD233C4F8373240B42303A3B8800FD1D1C19A8A16280844CA3D0E5ADD53D66DF47271E1295004A86D614BC5BF54D43234B7242960EA0E22329A97CB2A715CE50C1DDF5A5E0AC676C1ADDBD4283295BFC1B53451A65B1B300F26265EED0D6CDB85F1DD146C55257FFD8092E0EE98A5469A405F427C063CFB68ED8B8E3F024643DDDC5D5A8627567BC85BFB7D0AF842F0A189E7721968EFA0446AE1F935237C784D49253766508CF66BBC756D17C6C98A2E3401F3DE2C6F6CBE93A71D3765333E81760355A2738BF4E8250625769BEF70A0F286E32498AD07FA4FD6E02BFC93291E6113D08E7A4B3EB8A0C791B74AC2DE18147F00500CFD6FA46C6CCF33FFDFDB390BB156BF0EECFF0C198FE741CE99D500A92717BF3C0703EF66088E82343D2AB62ADE5D94C24C90794C35E2345FD6DCBBFD6017A37775763095626734F03C81A0B726BF608E66F7382E9DFB07C83CFA9F0BBF8B23387A540E231B2236BC2749DFB5CAB657525D4A9FF7D1F85B6C53A81562E31F28ED7B60FA81DDECFC2B8862EEEB7F2DBD54AF6D10EEBBAB6F1FC2E887652938F56E92B07734045F668CE6A4BA9F9A49CBAD079642D52F2F78C31A2EED77C2E6071CE06EE3349EFF9E8B9C00B2D309AE1A5164FEE6F28DAA2722AE8CE98924D114CFDBCB5CD59234DBC79251D6EE874EC8D2FF5B5FF1F5FCB74537B48ACC5C379786270AF7762564D54D91'
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