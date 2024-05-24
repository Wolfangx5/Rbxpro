const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_601DA514FDA7D254AA13FE431E4A9827670C2425AB0CE05A817CE68DF9A4EB82BBDFB1C236A6001936969ADC7D0683E2ECDBCDF86A36C1C96EB1290F38B2C7A897F6FA789E0DD532FFAC0F473F5FAE5325A2E628A3CA42FB91E31F84C05FC66DAFB88ACDEA42BE34EDA5FD705737651EFEE947423323496FF2B6FCFC4ECD62C0F99AFC4F95C5C083E3F0EDADA785FF9B5F0246B37FCF3DDCB8A9B5FEF5FD3A9B889B3D79C3D4701D2AC386B4C278501180FB8B251E54165D261AECB657BEFFD54216A4671A9C3FBB0BE01F08661CA4E21D075A3E82ED9853FD310399677C75B91818156E0DA6FE82986C68F6B43ACA87F1C79582C930D16E12B6C6A98C294DC96252B7C7E6A335A879C5DD00BE3340EB0C55FA286521DA2F41EA0A28C38FCC5BC2BCEBA72752BE710E14832FDF7A22954375CF07411225B61074CCE50B1B3AB4442CE429AD7C7F8865A94777F64CF22E18AC9CC292223D0CC2D9EF1D2AD2AE0B2F526648D6219FC0E7A62E56084F1D5AA4A5E4D09E226AB763EF8A2EE0E7DEFEF2AF91B21B81C986128F697682A10E99EBD8FD648457EE683F6522B7FAAACDCAEA6CAF38CE6C7CF7AB7B005226F84665258F22A1FDF0738965670FBAAB3787A1EDC5DB6604DA532D71D690C80A6663C1F1109FA20CFD1BA54F4C595A345E9D5391AE1C430CB034C762F4E32FE19604B535078B5E41E513877E83363DCDA15B8AC7B1C4825223582CCA4F7962D98E7B17F3D73F7EDA03ED260AE35B7B49246B4C37D13D485D9894CD5BBC9129FDEF706FFAFF1B1EE5B0A17D9861D34816B80994DBE2B4C71E354AA2573BED42EAB0BF6347120F0B5E0DD71795672A90154C6F8B050C453EB20653424C5AE10D6B3534B9F0F8921C48755EABB79EDAC16BC65813B0AE4758D4821D9185BD9E3536D4C0E3E9171E058E6D2FC3ABA577AEC8909456E6DA45345619C4A49EB5188EA74CD3742A0731E83B80835205FFF57FE1A856CD8580B6CEF39F7E07C2997CB02AE70BB3D87D736FD176BAB388C81C64E0563B8A732AFF53')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_601DA514FDA7D254AA13FE431E4A9827670C2425AB0CE05A817CE68DF9A4EB82BBDFB1C236A6001936969ADC7D0683E2ECDBCDF86A36C1C96EB1290F38B2C7A897F6FA789E0DD532FFAC0F473F5FAE5325A2E628A3CA42FB91E31F84C05FC66DAFB88ACDEA42BE34EDA5FD705737651EFEE947423323496FF2B6FCFC4ECD62C0F99AFC4F95C5C083E3F0EDADA785FF9B5F0246B37FCF3DDCB8A9B5FEF5FD3A9B889B3D79C3D4701D2AC386B4C278501180FB8B251E54165D261AECB657BEFFD54216A4671A9C3FBB0BE01F08661CA4E21D075A3E82ED9853FD310399677C75B91818156E0DA6FE82986C68F6B43ACA87F1C79582C930D16E12B6C6A98C294DC96252B7C7E6A335A879C5DD00BE3340EB0C55FA286521DA2F41EA0A28C38FCC5BC2BCEBA72752BE710E14832FDF7A22954375CF07411225B61074CCE50B1B3AB4442CE429AD7C7F8865A94777F64CF22E18AC9CC292223D0CC2D9EF1D2AD2AE0B2F526648D6219FC0E7A62E56084F1D5AA4A5E4D09E226AB763EF8A2EE0E7DEFEF2AF91B21B81C986128F697682A10E99EBD8FD648457EE683F6522B7FAAACDCAEA6CAF38CE6C7CF7AB7B005226F84665258F22A1FDF0738965670FBAAB3787A1EDC5DB6604DA532D71D690C80A6663C1F1109FA20CFD1BA54F4C595A345E9D5391AE1C430CB034C762F4E32FE19604B535078B5E41E513877E83363DCDA15B8AC7B1C4825223582CCA4F7962D98E7B17F3D73F7EDA03ED260AE35B7B49246B4C37D13D485D9894CD5BBC9129FDEF706FFAFF1B1EE5B0A17D9861D34816B80994DBE2B4C71E354AA2573BED42EAB0BF6347120F0B5E0DD71795672A90154C6F8B050C453EB20653424C5AE10D6B3534B9F0F8921C48755EABB79EDAC16BC65813B0AE4758D4821D9185BD9E3536D4C0E3E9171E058E6D2FC3ABA577AEC8909456E6DA45345619C4A49EB5188EA74CD3742A0731E83B80835205FFF57FE1A856CD8580B6CEF39F7E07C2997CB02AE70BB3D87D736FD176BAB388C81C64E0563B8A732AFF53'
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
