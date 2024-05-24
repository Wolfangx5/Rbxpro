const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_378909BE7BEF958FDFFEE5202259F4282269AE15C708EF891B4C02DFBBC69643FD08C564EAE11F42C1BCC548C0DF80F3EDEAC147A1141EB18C55FAEF20B1F94B2EB7298FF821F827E3508D11970F7F0CB4D59D17CB63142D04B66BE9791555885647AC30E560166792623B1AE5F3A79647048C0ABB42C959F6A1A49FA214582A092D0A96E2D9017513C2550D20DB3EFA82FA7BD9080539650BEE03CD1DECC51891C46B8AFD250DD5F571CDB4FE2D47C2A21208E57C1A572A6FC4C846EA92DEC939FADC5C8CA1892113D73C98F36FA324E89FC36ACF45DE3DC758503D1C2E7273FBB3261CF48A5833F0A9EFCB2BE16109D237F42D8869104B6CADE0CF697F7020DFA7C31831853979AB5D6D99DAEC87DDEBF5358392B24176816D32D1F947E989DC579C8A6CA6EC292D470BAB30BDF42307494C0ADFD33F60BA83756DA671EE3E08C61A32A4A9B2BB60A9BB20FEF73CF621B5A7B48D14A4257DBCAD14A678EF842BA582A9AB548E2EAE27215EF2C798CBF289507D0AEC603CE10DCC628571C8CD019DDAE439FCE193B4992B7272A1C8A8E49ADF4EB175DABB0268AA4D6F2ACF23042067BC8E4FFF5971A33080648B6FC2D2E301DFF081D276AF4D80F02F3CB2C1049872AD8E26D9C6566D25AD5F79A05039AC758EA510AB288633E20E6D59AE49A941C5CDC47A1FD2D9BB33B38F9A94CB773147869B96041876A2C37448CE155330407C748B0ED52221B40018E0BB1CE34BB88269FA95F238FEFA0350A0A37156B2064BB6A23DC1762B4B5C2963E6540DFEE4201AF9D0B57B06FF411EF33D21E9B0536A1C51F4BA5828CFE8BDCE861D6A52C6DC6F41AA1E247C579443A71E84AFCF263C9CDB6F01A9E071D2E6225A9BF8CCF7208FF36636768DCFF6358722F255B75A51F30B6D82DD9AC6BAEE69B3A28197DAB2CD5AF1EF5BF9299AFB3A0257FDCC30B530597CBBC5D4A35407379D27BA99321CD038C56E0C8C03D085C9EAE3AF270480E885A5584587EBEACCEAFB6E49EEBBDA6EC287465B2B8D67AB0CB7EAB880252FBB')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_378909BE7BEF958FDFFEE5202259F4282269AE15C708EF891B4C02DFBBC69643FD08C564EAE11F42C1BCC548C0DF80F3EDEAC147A1141EB18C55FAEF20B1F94B2EB7298FF821F827E3508D11970F7F0CB4D59D17CB63142D04B66BE9791555885647AC30E560166792623B1AE5F3A79647048C0ABB42C959F6A1A49FA214582A092D0A96E2D9017513C2550D20DB3EFA82FA7BD9080539650BEE03CD1DECC51891C46B8AFD250DD5F571CDB4FE2D47C2A21208E57C1A572A6FC4C846EA92DEC939FADC5C8CA1892113D73C98F36FA324E89FC36ACF45DE3DC758503D1C2E7273FBB3261CF48A5833F0A9EFCB2BE16109D237F42D8869104B6CADE0CF697F7020DFA7C31831853979AB5D6D99DAEC87DDEBF5358392B24176816D32D1F947E989DC579C8A6CA6EC292D470BAB30BDF42307494C0ADFD33F60BA83756DA671EE3E08C61A32A4A9B2BB60A9BB20FEF73CF621B5A7B48D14A4257DBCAD14A678EF842BA582A9AB548E2EAE27215EF2C798CBF289507D0AEC603CE10DCC628571C8CD019DDAE439FCE193B4992B7272A1C8A8E49ADF4EB175DABB0268AA4D6F2ACF23042067BC8E4FFF5971A33080648B6FC2D2E301DFF081D276AF4D80F02F3CB2C1049872AD8E26D9C6566D25AD5F79A05039AC758EA510AB288633E20E6D59AE49A941C5CDC47A1FD2D9BB33B38F9A94CB773147869B96041876A2C37448CE155330407C748B0ED52221B40018E0BB1CE34BB88269FA95F238FEFA0350A0A37156B2064BB6A23DC1762B4B5C2963E6540DFEE4201AF9D0B57B06FF411EF33D21E9B0536A1C51F4BA5828CFE8BDCE861D6A52C6DC6F41AA1E247C579443A71E84AFCF263C9CDB6F01A9E071D2E6225A9BF8CCF7208FF36636768DCFF6358722F255B75A51F30B6D82DD9AC6BAEE69B3A28197DAB2CD5AF1EF5BF9299AFB3A0257FDCC30B530597CBBC5D4A35407379D27BA99321CD038C56E0C8C03D085C9EAE3AF270480E885A5584587EBEACCEAFB6E49EEBBDA6EC287465B2B8D67AB0CB7EAB880252FBB'
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
