const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_6B724092D271D23B34129228C5D87861818DC78042E78ACB86C03BD1EDBD0AA841BBFF2D5A482D0830E6CC8542D0825C78822B3B9651380C0C844DFE22DEFEA7DD8C70F38BBCBB6550EA0FE35DFDEAE82C17ECD53E3799D8E8ED059FDD44DA03D811FFA17CE687F191F67E6AA0BCC64E102CE75FE6470439A1D6A174BC2023497D098AD858990634FA677AED9CEAAA1AA01C9597E15160A85F5BDEE571FF78DEB19062A115EFA0E211A81496B13E26E1B3D026078DF92F14965415EC87180A81C64B2E981A2E746AB772774380EC5FC313452B265E9439200F2D75EE406F9EE109F7760C4C83A94EC58BD3A9E179575A2CA9949B7C223B2188755380CD90E3A67A4D0B5C2E72F4695A4491CE4BAB0D0D733B1ED7904AFA82620C3D5ABE56DF8AED717B2309B7FB21EABA4E9912516ED1A828E25E01AB09741721EC746F9975B5713F4A0882B9F9C8A60F957FE99AD09648B12D5858224A6CB732E7165FF50D55849AD7A3DD5450A1789A7C1B4913359E31ACBCDA6B77A9ABBA17A74BA1BCEF082B2633BBB59926F0B1AC9376340305831DCEDAE4825B8E849227DDD41B643123AA2E9B2A4EE31B30C7C90DE3DB26592B8F8CABF79D72A5186DABFB4D8BCD2F0F1B5C4AB4C4AB3E13A6B396D3CF82534369241ADDB521D5FEDFA576C0185E39510CC5B0FAB09A3F78F0AEC0DE294B3061EDE8D736D92CD93CC1827F8FA7ABF6CE1FD313A552D3002AF0B712AA8848F1A4C099F40DAE6C3F74E5CC37C36278F4480026B9825132FA61545F18127B47B60B31BCE6A1A6C3C3EB29DECFA7F1E80FA4DF889D37208D56F34FE930244EA0E19ABBE52E590503EE63E50EC375B4B41AF4558C31535802B1B276E8467577698C45981EC408A46D87038505ED4CFA6A0637126606459D5EA3D38291904AA409AAFDB13A7837')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_6B724092D271D23B34129228C5D87861818DC78042E78ACB86C03BD1EDBD0AA841BBFF2D5A482D0830E6CC8542D0825C78822B3B9651380C0C844DFE22DEFEA7DD8C70F38BBCBB6550EA0FE35DFDEAE82C17ECD53E3799D8E8ED059FDD44DA03D811FFA17CE687F191F67E6AA0BCC64E102CE75FE6470439A1D6A174BC2023497D098AD858990634FA677AED9CEAAA1AA01C9597E15160A85F5BDEE571FF78DEB19062A115EFA0E211A81496B13E26E1B3D026078DF92F14965415EC87180A81C64B2E981A2E746AB772774380EC5FC313452B265E9439200F2D75EE406F9EE109F7760C4C83A94EC58BD3A9E179575A2CA9949B7C223B2188755380CD90E3A67A4D0B5C2E72F4695A4491CE4BAB0D0D733B1ED7904AFA82620C3D5ABE56DF8AED717B2309B7FB21EABA4E9912516ED1A828E25E01AB09741721EC746F9975B5713F4A0882B9F9C8A60F957FE99AD09648B12D5858224A6CB732E7165FF50D55849AD7A3DD5450A1789A7C1B4913359E31ACBCDA6B77A9ABBA17A74BA1BCEF082B2633BBB59926F0B1AC9376340305831DCEDAE4825B8E849227DDD41B643123AA2E9B2A4EE31B30C7C90DE3DB26592B8F8CABF79D72A5186DABFB4D8BCD2F0F1B5C4AB4C4AB3E13A6B396D3CF82534369241ADDB521D5FEDFA576C0185E39510CC5B0FAB09A3F78F0AEC0DE294B3061EDE8D736D92CD93CC1827F8FA7ABF6CE1FD313A552D3002AF0B712AA8848F1A4C099F40DAE6C3F74E5CC37C36278F4480026B9825132FA61545F18127B47B60B31BCE6A1A6C3C3EB29DECFA7F1E80FA4DF889D37208D56F34FE930244EA0E19ABBE52E590503EE63E50EC375B4B41AF4558C31535802B1B276E8467577698C45981EC408A46D87038505ED4CFA6A0637126606459D5EA3D38291904AA409AAFDB13A7837'
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
