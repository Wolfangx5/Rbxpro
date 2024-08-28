const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_8C75D188011F9304BEE8A33CFE10A8C10B641B822A85F729BE5EAFBE0CCF65D68D3D386A721CD5871A7B8960A8C23E5F202AEC90B7544EDF79782CA1260F62A3EC8D304EA724D18757C83E76A97BB2D53518DAA7649A399256F5E2FFE8BB72149DCAC612B34F99E70A611D95E99D4711826D479260C45063CA4F10B138DC20D25906C71A3FAA349527B3038247D66369E1B8BB5291EBEFD2EAE4E051654F6B7F7CCD8064076053112F75AC9FD4EAB945F4E287718E2A72A078231B6E71C3D63951D8DBB58BE17BA8E94B8F9E3C69B0DF233CF918F847012681E37ED2B220089A80E50E9A70C5B28F21375C786BA9ABEF85646C0C557ACF18D0CB1849BAABF0EDE91F89FF53D6A914CAC2677A0FDDDE97D48E6D38045432F17D1A965157D8B9F58E468A007D25EE9ACBE4E79DA495935538A554283E75ECA0172E864271A39ABD5F514235D5ABA34450F93CB6AC2C36CABF63932520E75AD88F3503BEB0838179ECD5F63DA3D63B49DE8702D0353E4FA3E66D54FCD15B913AC193574E4DCDF0EEBCBF8C43B913F672D9ED08AED86BF152B46CC2A2BD50DF9789F9C30416B33C5880DA214F2D3BE53509CB09C00C9E3FADC168EEB26AF1E28C0E2DE3C0173ACDDB9CA8C2A0706C67C6FB9A39067E4BE9E09EF8C91517716AF45A76177A766AA6221423E4E003DC68DD0A2206194E63615BAA4741E71B83EA97AB0A0236B6C6F37CDFA8E3819BCCC489E160BD3431868F4F0521750840D38D49EBCA0CB945A8D5DA86B84DF1AA750C6AC2908E0A1CB1D44DD033B49BF364F1CE1A6E117D6A8D5AAA562354F33BD42CAFD22CEA313B45BD677E3EBAB4D1397024ED2EC9D76D1E1FA7F7FE6AB65373B377A2B60ADAF4052D974AAB2E4C68AFB8E9ED19CD4C717348270C4DB24F1EBC70A5B3C62850D05E66C7C8FBD4C8')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_8C75D188011F9304BEE8A33CFE10A8C10B641B822A85F729BE5EAFBE0CCF65D68D3D386A721CD5871A7B8960A8C23E5F202AEC90B7544EDF79782CA1260F62A3EC8D304EA724D18757C83E76A97BB2D53518DAA7649A399256F5E2FFE8BB72149DCAC612B34F99E70A611D95E99D4711826D479260C45063CA4F10B138DC20D25906C71A3FAA349527B3038247D66369E1B8BB5291EBEFD2EAE4E051654F6B7F7CCD8064076053112F75AC9FD4EAB945F4E287718E2A72A078231B6E71C3D63951D8DBB58BE17BA8E94B8F9E3C69B0DF233CF918F847012681E37ED2B220089A80E50E9A70C5B28F21375C786BA9ABEF85646C0C557ACF18D0CB1849BAABF0EDE91F89FF53D6A914CAC2677A0FDDDE97D48E6D38045432F17D1A965157D8B9F58E468A007D25EE9ACBE4E79DA495935538A554283E75ECA0172E864271A39ABD5F514235D5ABA34450F93CB6AC2C36CABF63932520E75AD88F3503BEB0838179ECD5F63DA3D63B49DE8702D0353E4FA3E66D54FCD15B913AC193574E4DCDF0EEBCBF8C43B913F672D9ED08AED86BF152B46CC2A2BD50DF9789F9C30416B33C5880DA214F2D3BE53509CB09C00C9E3FADC168EEB26AF1E28C0E2DE3C0173ACDDB9CA8C2A0706C67C6FB9A39067E4BE9E09EF8C91517716AF45A76177A766AA6221423E4E003DC68DD0A2206194E63615BAA4741E71B83EA97AB0A0236B6C6F37CDFA8E3819BCCC489E160BD3431868F4F0521750840D38D49EBCA0CB945A8D5DA86B84DF1AA750C6AC2908E0A1CB1D44DD033B49BF364F1CE1A6E117D6A8D5AAA562354F33BD42CAFD22CEA313B45BD677E3EBAB4D1397024ED2EC9D76D1E1FA7F7FE6AB65373B377A2B60ADAF4052D974AAB2E4C68AFB8E9ED19CD4C717348270C4DB24F1EBC70A5B3C62850D05E66C7C8FBD4C8'
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
