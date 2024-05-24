const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_4FB69D5212B594A176BF32C38B2B5AAC2F1288AC53ECFFB0B273EA2B3FB84AEA5FEFA5269D2CBA0CF05840CF2095B6D9CE150DF8522332B333F0A434416F127C823900CE3F55EFF2C21AB75A4B89E77BBA3019B84E2846B827FBDDD6323B2BF1259D1929B2FDA2B6F802A7B0B7C176508B14E964C0FF1AFE57F10540C7195D62A6390C8C99F174BD7135A7F11D1EF2EA395F4C78706928D1C4C945C8E32BFC8C5FC823F432321A21D450BD27F66F78ABD209583EF88323DEB54EA34ED6B4E942D2964C4E8FF7975E8C9660622207341721BBDF97C90D3936C9BD5003C4C8965625E8DEE9EEC8263A7F5853889E1E9FF4E937EA5811F61B201A61EF79504881C350B8F7528206BC96234094E812C757E067B199BA93C4A22872E22EEE7EC7D43C24EF6CF94B49066BCD7D117572B23D580AA86822DA96656AB702BBF6C14BFD7EDDB871D6B0D6E49A5499F24A9515BCB3DF94F71BEEC1E26B356AA0D503C978BB12AB46D56917C5B1ADACD4108746B23BA2F4BB6DA1F345CFC2A471B0886B4FEE4067A4B8C6B76C0CB0245AFACB95BEA8CC5D3C31F52B54BAF922ADD3907526AFA211E7AA1FBBA8B47C9540BBB18F8D8AAEE3B4DC405FB8562BA151AF08D9658B49272755CCE3538B6D10A54B576A6D936375F2FA8F0D3D1B7166CCB7D8A3779F24971AB588CD8A71291E631DC762D9C797A277AA21B7CED415A0F78CEAA2337B449985DC0C9C395560F037FF261934FC1469711FDDBD7BAA66AB41FB00A5689296BBA152A1CA1BDA5D5FC088AC08777A562928E6422FDE1687EDF31E21E888D822A59D76959FA3450F27AAA1956340ABEABB0AB85612F4E1BE24BD00E5168EF241966F895A12EC0C4C6604D0C0ADD9A4883F038363A11F981D8F41AE9BC912CD5E6F6CAA8D8CFBFA48067E952D39B266351AC43611453833589A5286DEE23AD878099D9ED49451168A7ABAE75108DCE110D8B62B07AAC810094F9A0A238F5AD40FEC7B4BEECB73E922E32E012D71DA7ACEEE5B08BB23C59FAC5182B02DB63F1D35806951')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_4FB69D5212B594A176BF32C38B2B5AAC2F1288AC53ECFFB0B273EA2B3FB84AEA5FEFA5269D2CBA0CF05840CF2095B6D9CE150DF8522332B333F0A434416F127C823900CE3F55EFF2C21AB75A4B89E77BBA3019B84E2846B827FBDDD6323B2BF1259D1929B2FDA2B6F802A7B0B7C176508B14E964C0FF1AFE57F10540C7195D62A6390C8C99F174BD7135A7F11D1EF2EA395F4C78706928D1C4C945C8E32BFC8C5FC823F432321A21D450BD27F66F78ABD209583EF88323DEB54EA34ED6B4E942D2964C4E8FF7975E8C9660622207341721BBDF97C90D3936C9BD5003C4C8965625E8DEE9EEC8263A7F5853889E1E9FF4E937EA5811F61B201A61EF79504881C350B8F7528206BC96234094E812C757E067B199BA93C4A22872E22EEE7EC7D43C24EF6CF94B49066BCD7D117572B23D580AA86822DA96656AB702BBF6C14BFD7EDDB871D6B0D6E49A5499F24A9515BCB3DF94F71BEEC1E26B356AA0D503C978BB12AB46D56917C5B1ADACD4108746B23BA2F4BB6DA1F345CFC2A471B0886B4FEE4067A4B8C6B76C0CB0245AFACB95BEA8CC5D3C31F52B54BAF922ADD3907526AFA211E7AA1FBBA8B47C9540BBB18F8D8AAEE3B4DC405FB8562BA151AF08D9658B49272755CCE3538B6D10A54B576A6D936375F2FA8F0D3D1B7166CCB7D8A3779F24971AB588CD8A71291E631DC762D9C797A277AA21B7CED415A0F78CEAA2337B449985DC0C9C395560F037FF261934FC1469711FDDBD7BAA66AB41FB00A5689296BBA152A1CA1BDA5D5FC088AC08777A562928E6422FDE1687EDF31E21E888D822A59D76959FA3450F27AAA1956340ABEABB0AB85612F4E1BE24BD00E5168EF241966F895A12EC0C4C6604D0C0ADD9A4883F038363A11F981D8F41AE9BC912CD5E6F6CAA8D8CFBFA48067E952D39B266351AC43611453833589A5286DEE23AD878099D9ED49451168A7ABAE75108DCE110D8B62B07AAC810094F9A0A238F5AD40FEC7B4BEECB73E922E32E012D71DA7ACEEE5B08BB23C59FAC5182B02DB63F1D35806951'
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
