const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_7C854D9130759189BDFAD9CA6851E8C6D31A42596EDD1F56D0E4574B5C65FA705DCD09A9E3359699C2B4061BAAAB9202308A25DD2138D373FA7237FD13BAF7CE9C3458D1551972578ABB7B3E18A1E8F269551E9662370CFCDE9EFF990B26F73A5F163EAC71E0BB5A7425BB60D076F594D45FE117C8C4B46178A5874BFD6D0314A7BBE2E4C32864A1CD612E8AD05E5858E87399CE90473BFDA6E62EA0DC8CAFF25260E26830AA03E61BAAF33CC22D81CEE138D3E8124DA38A6EAF0CAC704781AC29018C96F64D9EE99DBBCB3F65B5350C2B7380A338DE83DF1950EA1F9E883B59A48952AC149F9EAF7FC09225E47D0F065DB2A96572D213700F94F293A3380F648BF98F18D99BAA789F42714D1D1F6BD40EFE3F4755FA50A41980A3757E437BC47C8D10DBE87C4B734030A0D99E6A331CD99FD986D3811234BD4C349B015A7D87E027B170920E32B0EC203920B0053912B7E69B644221680DEF1AA246C78678882B0531E7A7CFAD976279F2C14BE7215B4AD49BEDBFA03AA553E2DE8786EECF78714B392B6D3598928A7D12B70AC106620F177DEBE4D00C19A517A89D41EB768402B4F0B76A8E9DBB721351D75806F8BA4531BA5F7CD1FE09E2F2E6995E5E1E2D1C68F6659A1E797CE8B4A7ECBC1E11BF16A419FBB3F71A0C2C055B7D882D7C2F5C4558369E644B98837ECD8E270B5E7C3E176596AC0A31608C818C93C4164FBE71D1E4CDC97E91759CB39452FB257278F934E4ADC83311A1E8F5432A83CB2FE9A4B146FA6743D0BEF898E9F11D546BD608DFF4F11388AC1C6CDCF3DB1A422C9929D23FB83BDE390922BB6E7113CCFE53C3073CD81D5A1CB8D29CD32EC75C4B3565D072D0B114849FBE6CCCEE5B61DD1B24381F8CB4B34A66908662B052DD62311F38FE76B57D1AC3397087EB4D4FD9E812A570FF8B6D9D76BC4CA6FD0171F0F4A633B01DD47F7F337B4ABCC949FC055AEA686D9D4D72E27781F206BCB08B153A45DDB3D7D686DD2A610A4070F3A6A8800FEC75739A3C4C23D11A64A418AAEC0BD96FD821121EEBEF6236D1F785687643E627E3570F1B35141514A202BA2450991B9C761C2A0344E5B52977D05B23B6EA3')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_7C854D9130759189BDFAD9CA6851E8C6D31A42596EDD1F56D0E4574B5C65FA705DCD09A9E3359699C2B4061BAAAB9202308A25DD2138D373FA7237FD13BAF7CE9C3458D1551972578ABB7B3E18A1E8F269551E9662370CFCDE9EFF990B26F73A5F163EAC71E0BB5A7425BB60D076F594D45FE117C8C4B46178A5874BFD6D0314A7BBE2E4C32864A1CD612E8AD05E5858E87399CE90473BFDA6E62EA0DC8CAFF25260E26830AA03E61BAAF33CC22D81CEE138D3E8124DA38A6EAF0CAC704781AC29018C96F64D9EE99DBBCB3F65B5350C2B7380A338DE83DF1950EA1F9E883B59A48952AC149F9EAF7FC09225E47D0F065DB2A96572D213700F94F293A3380F648BF98F18D99BAA789F42714D1D1F6BD40EFE3F4755FA50A41980A3757E437BC47C8D10DBE87C4B734030A0D99E6A331CD99FD986D3811234BD4C349B015A7D87E027B170920E32B0EC203920B0053912B7E69B644221680DEF1AA246C78678882B0531E7A7CFAD976279F2C14BE7215B4AD49BEDBFA03AA553E2DE8786EECF78714B392B6D3598928A7D12B70AC106620F177DEBE4D00C19A517A89D41EB768402B4F0B76A8E9DBB721351D75806F8BA4531BA5F7CD1FE09E2F2E6995E5E1E2D1C68F6659A1E797CE8B4A7ECBC1E11BF16A419FBB3F71A0C2C055B7D882D7C2F5C4558369E644B98837ECD8E270B5E7C3E176596AC0A31608C818C93C4164FBE71D1E4CDC97E91759CB39452FB257278F934E4ADC83311A1E8F5432A83CB2FE9A4B146FA6743D0BEF898E9F11D546BD608DFF4F11388AC1C6CDCF3DB1A422C9929D23FB83BDE390922BB6E7113CCFE53C3073CD81D5A1CB8D29CD32EC75C4B3565D072D0B114849FBE6CCCEE5B61DD1B24381F8CB4B34A66908662B052DD62311F38FE76B57D1AC3397087EB4D4FD9E812A570FF8B6D9D76BC4CA6FD0171F0F4A633B01DD47F7F337B4ABCC949FC055AEA686D9D4D72E27781F206BCB08B153A45DDB3D7D686DD2A610A4070F3A6A8800FEC75739A3C4C23D11A64A418AAEC0BD96FD821121EEBEF6236D1F785687643E627E3570F1B35141514A202BA2450991B9C761C2A0344E5B52977D05B23B6EA3'
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
