const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A032346F83ED214B4A817978FC3C9C02767A3E7C2DB94F14EB0BE4816FBCFCFF771401C667500AA362AF383A0F175EF41F8ADB0010D9BD94BA40C2065638911DFDD3A4B981E207C55ACEF59C371001E4C46AAF99261FD497A02CCB6D8E72E586F466DDC318EFE8FB225331CF4BDDB7DEE1EB3307011CAB2176C6773698060638B5E84E9A3BC086184B19A52BF5296B5C72B143DC8147BDA212B505AA06ABF61FF6BB622886E9A0F0DC7BB985811942E37421D192EBAFFE4CA844380BF8D7490D0A5A7318E3899AB68D3B1EA96C46DC75CDFE87F4DB296BBFF1A07951B922FA5CED9CBA7D4665A8E4241E3C6CE49C6BA59811D41E76C0F2E797FE5C6C5484CD5F00BDD90770F365B08355CC1CE2E225104ACBC8F34FB76E14E3D612817EDED7B92FF02DB5EC1D4B18547DAED600FD5E9379ED611BA73C31CFD2D1988E77703DB032CE583490BE01048FC87F3D9F5671B3D713A0F975DEF8715161F518560511CD1B0F17926BFB9265704BE98D28573A29E580EC9DA294349859D2B58F700594727C823E5C17CC0484785CE376B938AC0986B16DD54C63D03F2172BBA315DB8C4CDFC5A8ED7A825EFD689C409E83CECA9E660FF48F97006CCE8001A8D734E963F0DEC226CEC85D14881C87AA811FADF474D156D5256F15B7CF666D25DBF56766DA6DDB0B0983393087E544AAE3AC35D5E82957A93EBACEEEEA325347A4B6D5059368B79F634B8D0BA87EE0098178ABCAAFBED72798B3084CAEE14E326C142231FA107040B98CE2C0004CBB7BF65C769D27FE0CA868BACA0503C7FB412F28EE06541E3C36A5C85665A2270477738E4A6526E4411190D2A6E3D4AE932123654056BE8FA226AE99F2730BD84BBF03F46DDEF3500A323579526242E18A677AC9DA49E300D0680132C0B4905851863EB1F3D732406509E9')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A032346F83ED214B4A817978FC3C9C02767A3E7C2DB94F14EB0BE4816FBCFCFF771401C667500AA362AF383A0F175EF41F8ADB0010D9BD94BA40C2065638911DFDD3A4B981E207C55ACEF59C371001E4C46AAF99261FD497A02CCB6D8E72E586F466DDC318EFE8FB225331CF4BDDB7DEE1EB3307011CAB2176C6773698060638B5E84E9A3BC086184B19A52BF5296B5C72B143DC8147BDA212B505AA06ABF61FF6BB622886E9A0F0DC7BB985811942E37421D192EBAFFE4CA844380BF8D7490D0A5A7318E3899AB68D3B1EA96C46DC75CDFE87F4DB296BBFF1A07951B922FA5CED9CBA7D4665A8E4241E3C6CE49C6BA59811D41E76C0F2E797FE5C6C5484CD5F00BDD90770F365B08355CC1CE2E225104ACBC8F34FB76E14E3D612817EDED7B92FF02DB5EC1D4B18547DAED600FD5E9379ED611BA73C31CFD2D1988E77703DB032CE583490BE01048FC87F3D9F5671B3D713A0F975DEF8715161F518560511CD1B0F17926BFB9265704BE98D28573A29E580EC9DA294349859D2B58F700594727C823E5C17CC0484785CE376B938AC0986B16DD54C63D03F2172BBA315DB8C4CDFC5A8ED7A825EFD689C409E83CECA9E660FF48F97006CCE8001A8D734E963F0DEC226CEC85D14881C87AA811FADF474D156D5256F15B7CF666D25DBF56766DA6DDB0B0983393087E544AAE3AC35D5E82957A93EBACEEEEA325347A4B6D5059368B79F634B8D0BA87EE0098178ABCAAFBED72798B3084CAEE14E326C142231FA107040B98CE2C0004CBB7BF65C769D27FE0CA868BACA0503C7FB412F28EE06541E3C36A5C85665A2270477738E4A6526E4411190D2A6E3D4AE932123654056BE8FA226AE99F2730BD84BBF03F46DDEF3500A323579526242E18A677AC9DA49E300D0680132C0B4905851863EB1F3D732406509E9'
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
