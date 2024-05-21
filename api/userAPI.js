const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_75565DD36442F10E54067CFF3A20BCD0A3A5A1323D3082658CB960FA729F137A94AC4BD250F41E4B401A4B1CC1B369B4E15A52A32FEBA2E7F4AECE822D93115FC074519586F1FC9C2CE1009EFCBDCAC224601FD6035831E2C8C3803753B2D31F6A0771F02927DEFDDA593395FC9E438A35EB954AD6A01557F397DAA8EF81A7A7AB64EF38A9066F03DE5831B4E47862353691D7C0C68417626E5283F421D73D0D63C9CFDA106839149C087E69A79AEC99B0CFF7C35E4EE8FC74589C5183783D7985A7A2459DEA091FE15184C13C2A249632BB69384C42DB770C5ADCD453C9E2AB18DEDAF307CC1008219EB7182FFE56FEF43053E5737761A8FA2161C202112139E23F9D88808741596922F1B45A1FBD6ED56A6A069FC10F2273560DE2D9F37B65D2D4A9D680110256BF8134E99CBB5D4D2C0FC6EC6FDC1A7D6819E65104C6767DDE0B0169A9806476DF954B3AE234E70F7442715C94EEECD5F7F3210AC50920BAAD91E8E9225A8F26002A04AD82675AB4E8923A9A79CC2781755CF514C2AF484C7B5CEDFBA933E87105F2BA0CDFC193B1ADBBEFAE39A3AEA2E290FF689C52A065293AF0EA0AD3E5CF57701946E4B4F285AECBD95A472269535A078487E94EB28E178E751F8E79B48D5BB0166616E2624FB6A46947B0D37262755DC8196EB6BC48D2CB5E9AB41C870B8FC8FFEFC6388FC9128462639878CB4B35C8FBC9903F05268A517C1C935863C33F21FEF00CECB52B2F1A7D1BE825EB46431019AD75170B1653CC861E7EA1439C3D69E0832E533CEB6E258C21CFBB99D8DD43FB326F66CF8A128CECDFF0C95DF674AEC0CFC591E26F89EE877DC5E1B7F415F0D1D07D3C107A6F49285AB8F8013C2209F16C1DFE0A8747C09B144769306455515D8E23B1BAAD41C5ECA986F25CAF18EEEB7C93C25A051BEC911840E4294847B8EC4EDCF901B5764A4516C48B09DCBCACDE243212939A818C1A1480FBAC787286227043B83F1855E32495EDE25E911874459D1DD262F90BB8996C2458DF0E18E9FEF11172CCC1510F79C3')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_75565DD36442F10E54067CFF3A20BCD0A3A5A1323D3082658CB960FA729F137A94AC4BD250F41E4B401A4B1CC1B369B4E15A52A32FEBA2E7F4AECE822D93115FC074519586F1FC9C2CE1009EFCBDCAC224601FD6035831E2C8C3803753B2D31F6A0771F02927DEFDDA593395FC9E438A35EB954AD6A01557F397DAA8EF81A7A7AB64EF38A9066F03DE5831B4E47862353691D7C0C68417626E5283F421D73D0D63C9CFDA106839149C087E69A79AEC99B0CFF7C35E4EE8FC74589C5183783D7985A7A2459DEA091FE15184C13C2A249632BB69384C42DB770C5ADCD453C9E2AB18DEDAF307CC1008219EB7182FFE56FEF43053E5737761A8FA2161C202112139E23F9D88808741596922F1B45A1FBD6ED56A6A069FC10F2273560DE2D9F37B65D2D4A9D680110256BF8134E99CBB5D4D2C0FC6EC6FDC1A7D6819E65104C6767DDE0B0169A9806476DF954B3AE234E70F7442715C94EEECD5F7F3210AC50920BAAD91E8E9225A8F26002A04AD82675AB4E8923A9A79CC2781755CF514C2AF484C7B5CEDFBA933E87105F2BA0CDFC193B1ADBBEFAE39A3AEA2E290FF689C52A065293AF0EA0AD3E5CF57701946E4B4F285AECBD95A472269535A078487E94EB28E178E751F8E79B48D5BB0166616E2624FB6A46947B0D37262755DC8196EB6BC48D2CB5E9AB41C870B8FC8FFEFC6388FC9128462639878CB4B35C8FBC9903F05268A517C1C935863C33F21FEF00CECB52B2F1A7D1BE825EB46431019AD75170B1653CC861E7EA1439C3D69E0832E533CEB6E258C21CFBB99D8DD43FB326F66CF8A128CECDFF0C95DF674AEC0CFC591E26F89EE877DC5E1B7F415F0D1D07D3C107A6F49285AB8F8013C2209F16C1DFE0A8747C09B144769306455515D8E23B1BAAD41C5ECA986F25CAF18EEEB7C93C25A051BEC911840E4294847B8EC4EDCF901B5764A4516C48B09DCBCACDE243212939A818C1A1480FBAC787286227043B83F1855E32495EDE25E911874459D1DD262F90BB8996C2458DF0E18E9FEF11172CCC1510F79C3'
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
