const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_FBAC657C558D30FF66FED2A7F73D2477776DD95E1DBA5896720DFDC5D7A12A26B0B7EE11D0EE7484C7842E3BFCF7E3BC6D78ED240D5F9B457267AC1D7CC6189AF420D1CD12364286FCD7D7488BFA224F293B6CC5B86778B4E8E8C59191C356EA031583C4B0AA6BA1FD17A27CEA9DDCB57171DF517A5869D416C0F92C8C62BBB921B8DBDF3E2470DFC28549E99A75D2047CE51E1ED8683F5ADCD81F576659A6C6E7E0E3E3989108F99F611726C2F530D31AD5DCADE58E225971A5A9BE7E360FAFADD6ADB635EEA023E8EE3169AFC78753B5F2767A3D9348F307F1459E62EF507F3036394B3B0AFAD532465546B27421B4572AAD9F3126A3683D6DDB1597C1247650E22367F0B59547DDCA42E623A3BFEE1565C5EDCCCB6A1EC3D530A2D6202792186A6029F130537AEC3B306060C62BD2EBC127D3E7CB1696AD75EBC072BDC7A3425F8E55FACB773105D1F8A2927192C0355698C36A037440A93E4F3320F41CED054CC3276044E8A34626FB90D65127E8A7A552E25E4761427F240B2C6A37C21DB91356273119184407EF621097C474B24C0F30CB41B6B7131EEFE5A5934331DA72154ECCF46B16B2505B0EC5E0E93D93844CBE261947810466CF534FF6321B81933BEE950283F2FAC24E4F24896D61B84497FEA100DF5186771914DC548C9B904389B621FCA6942DEB31A6C8ADF88779AAB83EDBF646C60A2BBDF730FF7F2F3BD1A866AC8AF9DFBB22E385616EE73688B6C05A9BB186896A2BBA12A3855E233798AB2BE3EA9087BCB4D217B72F88AA3D4DEE090ADBF4A7BDF869D3CDDE8459E7A28D0F209676E2DB30E0575E559457B215BC00B6D45F34C02E0EE06C3523CEFFBEEAE338A321278AB57AF4BF81C8E39847877F76A15C4B94C234AFEF717B3DBAE153C3888EF0D98D92917A82578193CAECC21AF34A75B605BF7A412324FCB696FE86336F9A48132FE0BF0E7E579961D0FF7759F9C7FDDA4F1B24EC69ED6EADA2BD70185892677C85992C02F58B46D8F7251EBCFCD61008629F2F5860744CE91D056BB57D')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_FBAC657C558D30FF66FED2A7F73D2477776DD95E1DBA5896720DFDC5D7A12A26B0B7EE11D0EE7484C7842E3BFCF7E3BC6D78ED240D5F9B457267AC1D7CC6189AF420D1CD12364286FCD7D7488BFA224F293B6CC5B86778B4E8E8C59191C356EA031583C4B0AA6BA1FD17A27CEA9DDCB57171DF517A5869D416C0F92C8C62BBB921B8DBDF3E2470DFC28549E99A75D2047CE51E1ED8683F5ADCD81F576659A6C6E7E0E3E3989108F99F611726C2F530D31AD5DCADE58E225971A5A9BE7E360FAFADD6ADB635EEA023E8EE3169AFC78753B5F2767A3D9348F307F1459E62EF507F3036394B3B0AFAD532465546B27421B4572AAD9F3126A3683D6DDB1597C1247650E22367F0B59547DDCA42E623A3BFEE1565C5EDCCCB6A1EC3D530A2D6202792186A6029F130537AEC3B306060C62BD2EBC127D3E7CB1696AD75EBC072BDC7A3425F8E55FACB773105D1F8A2927192C0355698C36A037440A93E4F3320F41CED054CC3276044E8A34626FB90D65127E8A7A552E25E4761427F240B2C6A37C21DB91356273119184407EF621097C474B24C0F30CB41B6B7131EEFE5A5934331DA72154ECCF46B16B2505B0EC5E0E93D93844CBE261947810466CF534FF6321B81933BEE950283F2FAC24E4F24896D61B84497FEA100DF5186771914DC548C9B904389B621FCA6942DEB31A6C8ADF88779AAB83EDBF646C60A2BBDF730FF7F2F3BD1A866AC8AF9DFBB22E385616EE73688B6C05A9BB186896A2BBA12A3855E233798AB2BE3EA9087BCB4D217B72F88AA3D4DEE090ADBF4A7BDF869D3CDDE8459E7A28D0F209676E2DB30E0575E559457B215BC00B6D45F34C02E0EE06C3523CEFFBEEAE338A321278AB57AF4BF81C8E39847877F76A15C4B94C234AFEF717B3DBAE153C3888EF0D98D92917A82578193CAECC21AF34A75B605BF7A412324FCB696FE86336F9A48132FE0BF0E7E579961D0FF7759F9C7FDDA4F1B24EC69ED6EADA2BD70185892677C85992C02F58B46D8F7251EBCFCD61008629F2F5860744CE91D056BB57D'
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
