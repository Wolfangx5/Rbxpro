const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_33369F150F794A787FE701890D7821C88BE0B990AE54220652FA7ED788C093B0B7771CBC1BBF663DC48711A2DADF671D28DAD17BF3429F7231B6B537B8ECB52A3083FAE484F8567F5E116775D37B66D62C2FAA3AA52F540EB9E3A0D4CD850E536902E07BD39FBDEBFF0CC8A6FF206EA6EA332E5416FF8E254035C9B2F6E9872C1358DCE3994A8CEBC7AABFE9EC3AEF5BFE6A5805A3F5467297E17EC10D70EB40B8DE2175563D186CDC3C7A33EEFDB1633453DD688308BE0501C7B436333115DD766A1006574AB83DE14DB33BE4862C66A761B4A8CE8903D41E7C75A4CE8A5C2A6D2CBED9C4572BC922742A9E2932A4156A5707DF3CB1870236D83C6E2AAC5D0F6F041278301A25C3D0D4465905B8AB84CE7B83591FCB4A467970FC9A2C11497D77DE308F0E7B83085836E63C2C6C3EA3D70F8492941176BF6EB97EFB4A1E2E2C3C7F02759BDDE956C7D2DFBDC0332CCD459AF6604AD6D811132C7CEFACD15D27EF7E60383AD9076350AE3101628C1C70D512A0913E70F235777000423682CCE72A2C54F1472D813F9E3EBC5EAA26B88FA0FEFACDF01556FB1EF78E0990E4A7CD8E039F2AD0DC4685630EF6772E5384697CA407AAA3389E86866737F63DA0212B8B1711FB39C4B48E8CD5531481FFFFD8E88D4A7F43C96CD19493DE9522BCF150053936CC6C06857315E38C9231C8B61E7554CA429D373A5E4BC351115CADA7537498242D8703B3A7596680AB782D1575C50E9D6B5D4B703AAA047D9B95BBAE18AE8502C451E222FE91882D9A28458F4D2D9AC6601CA089B6BE0D14F63A7353C484B5548345C616C954940588249A7411AE4B8B4149506D883AD2E25D0BBD33C59AE394DF34A833A6F85461032F5506483BDA56F6217D9BFBD186B002AF7B9C27980AF5DC22C8021124E593C8940BAD1FFB59F6FCA01697466FC2F32656AA1FFCCDEE62DDAB09E5C48C3E048EDBFBF88F0AD66AB9')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_33369F150F794A787FE701890D7821C88BE0B990AE54220652FA7ED788C093B0B7771CBC1BBF663DC48711A2DADF671D28DAD17BF3429F7231B6B537B8ECB52A3083FAE484F8567F5E116775D37B66D62C2FAA3AA52F540EB9E3A0D4CD850E536902E07BD39FBDEBFF0CC8A6FF206EA6EA332E5416FF8E254035C9B2F6E9872C1358DCE3994A8CEBC7AABFE9EC3AEF5BFE6A5805A3F5467297E17EC10D70EB40B8DE2175563D186CDC3C7A33EEFDB1633453DD688308BE0501C7B436333115DD766A1006574AB83DE14DB33BE4862C66A761B4A8CE8903D41E7C75A4CE8A5C2A6D2CBED9C4572BC922742A9E2932A4156A5707DF3CB1870236D83C6E2AAC5D0F6F041278301A25C3D0D4465905B8AB84CE7B83591FCB4A467970FC9A2C11497D77DE308F0E7B83085836E63C2C6C3EA3D70F8492941176BF6EB97EFB4A1E2E2C3C7F02759BDDE956C7D2DFBDC0332CCD459AF6604AD6D811132C7CEFACD15D27EF7E60383AD9076350AE3101628C1C70D512A0913E70F235777000423682CCE72A2C54F1472D813F9E3EBC5EAA26B88FA0FEFACDF01556FB1EF78E0990E4A7CD8E039F2AD0DC4685630EF6772E5384697CA407AAA3389E86866737F63DA0212B8B1711FB39C4B48E8CD5531481FFFFD8E88D4A7F43C96CD19493DE9522BCF150053936CC6C06857315E38C9231C8B61E7554CA429D373A5E4BC351115CADA7537498242D8703B3A7596680AB782D1575C50E9D6B5D4B703AAA047D9B95BBAE18AE8502C451E222FE91882D9A28458F4D2D9AC6601CA089B6BE0D14F63A7353C484B5548345C616C954940588249A7411AE4B8B4149506D883AD2E25D0BBD33C59AE394DF34A833A6F85461032F5506483BDA56F6217D9BFBD186B002AF7B9C27980AF5DC22C8021124E593C8940BAD1FFB59F6FCA01697466FC2F32656AA1FFCCDEE62DDAB09E5C48C3E048EDBFBF88F0AD66AB9'
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
