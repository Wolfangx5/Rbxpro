const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_15AD209ADCDAAC41185A19209DBAB72964D1DEFA35BA61E0C695640BC748D47DAA7E985FEC3D4C09099F60E9FFB83EE6915617A5EA0DAA1BBD81D4BBCFD33755280ADFC49AB0DB5A94FBE6BB01FC20B3D066BB9E41121FFAB44564E6232BF7FFEDCE73A3AE86A94BA2E5131092ED4B74FCC6E4EBD123888E8FC8816C066A98B846094F615C01EC874FDA4C07A076160F7BEA3BA7F28E5D015896D7F6958039B01C1073A0AB3C4611F88B04C759E15C24292DB17BDB2B6400851A026F03872478656EDB3F301F2786B8489D10ADC813E87F586833D0CEA81762AC4FEDF0A0F26E28E884117A8D4E987227BE5F07D581B31D46E9551DEB29E65FA644221890BF658E6817DD080224A5916934E62E8C5193D7EF517A9192B6BF7B6616A8FE2C6847221587B97BE4977BA30058629A53FAE6EE3DBD4981E53C4469D0D260601FAA23CCE96D27075336B2C58BF16E391C22B9789FAE6C07AFD00C712C0C6C344E7B8E4A38F0993D41552F97FC42F35351DA9D7A0E2A87EBEE252D79F8785C9A308C74B69C4B335D40DB84A844E77B324A073E30B601F60E7609650B0B6E224F975C8B2F90B4F4681FD3EF629A1A50B77FAD84097F33D1FFF53FC0493AD6E8F1B961CB78825E1F5213A7D315119D83915C7F4CED970D3AAB65B62A7E82E005C6A79EA8930830634F4ED0675C4879F79A1AF33364AC5BE3E9F4E7B232F1AF36F48EA6BB7539105F583DCC859B3F06C2D12700DA92B032A3AD1DB924A56C6FEB0541C233799691BF3FABACDED83189681F4B781BC667AC81A338A98D1ABBC1BE92236A73EA46791229031DD57E201E326BE7B5CA5E64022D76863F6BA7C1639801384092EF6E73FFE3B670ECE1B98D4D597832A2E7834D2EFB18DA1820C878B194DE510ABA0AD4497359AF41E84EF133E573A76965C28D38')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_15AD209ADCDAAC41185A19209DBAB72964D1DEFA35BA61E0C695640BC748D47DAA7E985FEC3D4C09099F60E9FFB83EE6915617A5EA0DAA1BBD81D4BBCFD33755280ADFC49AB0DB5A94FBE6BB01FC20B3D066BB9E41121FFAB44564E6232BF7FFEDCE73A3AE86A94BA2E5131092ED4B74FCC6E4EBD123888E8FC8816C066A98B846094F615C01EC874FDA4C07A076160F7BEA3BA7F28E5D015896D7F6958039B01C1073A0AB3C4611F88B04C759E15C24292DB17BDB2B6400851A026F03872478656EDB3F301F2786B8489D10ADC813E87F586833D0CEA81762AC4FEDF0A0F26E28E884117A8D4E987227BE5F07D581B31D46E9551DEB29E65FA644221890BF658E6817DD080224A5916934E62E8C5193D7EF517A9192B6BF7B6616A8FE2C6847221587B97BE4977BA30058629A53FAE6EE3DBD4981E53C4469D0D260601FAA23CCE96D27075336B2C58BF16E391C22B9789FAE6C07AFD00C712C0C6C344E7B8E4A38F0993D41552F97FC42F35351DA9D7A0E2A87EBEE252D79F8785C9A308C74B69C4B335D40DB84A844E77B324A073E30B601F60E7609650B0B6E224F975C8B2F90B4F4681FD3EF629A1A50B77FAD84097F33D1FFF53FC0493AD6E8F1B961CB78825E1F5213A7D315119D83915C7F4CED970D3AAB65B62A7E82E005C6A79EA8930830634F4ED0675C4879F79A1AF33364AC5BE3E9F4E7B232F1AF36F48EA6BB7539105F583DCC859B3F06C2D12700DA92B032A3AD1DB924A56C6FEB0541C233799691BF3FABACDED83189681F4B781BC667AC81A338A98D1ABBC1BE92236A73EA46791229031DD57E201E326BE7B5CA5E64022D76863F6BA7C1639801384092EF6E73FFE3B670ECE1B98D4D597832A2E7834D2EFB18DA1820C878B194DE510ABA0AD4497359AF41E84EF133E573A76965C28D38'
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
