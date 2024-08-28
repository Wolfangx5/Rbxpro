const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_553A98C01EF41E9AF73373C0A93EAB8DC07684DB3C434D8E9FE2B426E8262E7AB2E969C0F645D621384C4BAC4486F99F56C35FDDA38BA8F573CBB616B376985FCF4268DF273EF34B3C2112223BDB33C3692AB39665F7F3A617AE5CBFBBB261115F0C65B794E8EE31C52B12E060328A43F2C501CDC1D6BB5249D978ED0E5AAC020359B7B5AD666607A1B4B5C89892515F129C53907945F603C9B6AE4362E257AB516AF2C49C616B59431D38F23FB4311EEA50ECC2CA9F076C273C4FAAA9635A51FBE9369DCD3ECB2B02ACFD003E7F2CDCE31DBADAE3880691F6C02038A9D61F5284863ABA7554B2BC6EDD196B3D892991384C3BB67C00A6739F9EBF5ACF57FFCE9D5348A33FD274F2FC2B8FEFA0EB1A0731A397FFDD63BF34837606DE9D9535210D236577133308D2E2744CC5146E5F1BFF7F268CAEBD4F2DC4E91457E151310D1ECE842587072226D6178D7CC477292F745F70C5662CEB4B2A5629C74FFC34DA494CB3E01BF6A292E990BC28771B444FA06AFC93B0D2BB446E241183A26E8CD4B77BA0220B9CBAC12052C22EF3EB966514DBF32A72D3D93D438F765D629F7D596D7F3300C97AD4FF9FD8B9F2ACFF725D721DF2F9B3E397B126AB0389B1AF4E9CF7813E72AB18AA8072A6A898FFEF0CA7B8A1EDE324DFFF9BFB08ED706649937D0CD1311A83DCBB40645A588CEC690558E87E1D9188A62E119C0630B760A313AD557C42D537D2EBDF8D9D239801DF4CCECE1420B9B4E0AF077418C03302EF9B629171CBE9623474A441AD29F6AF48037FE662AAA13C066257F14E136EBFDFF07BC7169DF9CB72C8E525E6AA3C35023CA3000CC5D6647BD44328A0D5A53AFE82A750A26BBE8D5B62D8335EFB0DFFB6DB2C1881C7216C8874896A3CEAFA7DCF45AE5E5CC289C6961DEC61D48B83E92BE36EFC347D76')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_553A98C01EF41E9AF73373C0A93EAB8DC07684DB3C434D8E9FE2B426E8262E7AB2E969C0F645D621384C4BAC4486F99F56C35FDDA38BA8F573CBB616B376985FCF4268DF273EF34B3C2112223BDB33C3692AB39665F7F3A617AE5CBFBBB261115F0C65B794E8EE31C52B12E060328A43F2C501CDC1D6BB5249D978ED0E5AAC020359B7B5AD666607A1B4B5C89892515F129C53907945F603C9B6AE4362E257AB516AF2C49C616B59431D38F23FB4311EEA50ECC2CA9F076C273C4FAAA9635A51FBE9369DCD3ECB2B02ACFD003E7F2CDCE31DBADAE3880691F6C02038A9D61F5284863ABA7554B2BC6EDD196B3D892991384C3BB67C00A6739F9EBF5ACF57FFCE9D5348A33FD274F2FC2B8FEFA0EB1A0731A397FFDD63BF34837606DE9D9535210D236577133308D2E2744CC5146E5F1BFF7F268CAEBD4F2DC4E91457E151310D1ECE842587072226D6178D7CC477292F745F70C5662CEB4B2A5629C74FFC34DA494CB3E01BF6A292E990BC28771B444FA06AFC93B0D2BB446E241183A26E8CD4B77BA0220B9CBAC12052C22EF3EB966514DBF32A72D3D93D438F765D629F7D596D7F3300C97AD4FF9FD8B9F2ACFF725D721DF2F9B3E397B126AB0389B1AF4E9CF7813E72AB18AA8072A6A898FFEF0CA7B8A1EDE324DFFF9BFB08ED706649937D0CD1311A83DCBB40645A588CEC690558E87E1D9188A62E119C0630B760A313AD557C42D537D2EBDF8D9D239801DF4CCECE1420B9B4E0AF077418C03302EF9B629171CBE9623474A441AD29F6AF48037FE662AAA13C066257F14E136EBFDFF07BC7169DF9CB72C8E525E6AA3C35023CA3000CC5D6647BD44328A0D5A53AFE82A750A26BBE8D5B62D8335EFB0DFFB6DB2C1881C7216C8874896A3CEAFA7DCF45AE5E5CC289C6961DEC61D48B83E92BE36EFC347D76'
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
