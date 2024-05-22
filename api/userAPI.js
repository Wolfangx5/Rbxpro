const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_DBEFF5CB5785591B0ED452E792471B1C638B40044F74CB77C9A7EE41977A9BCEA72A52E56C732FC92EF5B492E610298D76319981A87FA6312221449924455CAA4CCC3D7CAA66AC731A3D4727FC02B84B3CD985EA93574A0AD2BCCF87C22E8FFD2B4F79F050C852B7145EAA7D25AC302D0307876A1EE92A077B74CCFDBFDD3BB2D419C3655B993E70870F4F19C1E5DA153646D6C08DBA4D1E194F63091A126FAB78FD97E71CD5EEBEF8D352291BBB39949204F5A83B5A9AC789F0BBCC5E61316059D87A053D034ED50BD6DA84921BD708C89FFB64ADFD59293FE6B4E18E0E575D6052C9DB84F825D35CF3C00C926092509F1EFCED126C9DEA372C8464C093E1918E393DCDCC3714B79C5E9502109151A67355FD217B6DEFB102C7FB669959955A216AC1E1BBA540773A3E511779B6E019F14DBAFD8E6858435D11C2C24A1FCCDB06DC798185EFB47311ED25E03BF4971159A065D4CD78E5B3D6BD79A236762FD1811E5B00B6F9354FBF2D631918B38EECBDACC59E7DC66A02ACEE9D27D6D7BCBC4DD9D188D0A01BBD1CB5688ED199BEBA56CBB7A0BDB64C373B454DBE7EB2DB9675610516EA6C53D12642A20B1B2F88AF25859C341A4EB038AE5DEA07EF2028D4052F2340FA419F2FEA697D41963D63C34AD5CDFB240DA57D6F7507A8669405548E692100AE816630508C1A97F2A576445C6E5DD6867638872B50C0A5B3F1B63FE7C3C8FCB9ADE7EBE50E13566FA602DA461CC6EA913669D10D246D2EDD3E745C5331CFC4574F3E8C783F90A792C0090599E51F027A3872B394CF82DBAFBA71672A3A9A2F61FF03F718DE556BDDD2D0B626F1B59D8192854B18F02E914CB779D4EDBC0F2FE1E0FCF0A66C3E2F32B137742F192E77A81A88D4D3687FE14DD1A15516EC430989E196B614776B3312C6C5F84E85E6B6B1F2A11284D6CEF028A345BE51C51AE0709BFA8CA2C9090CA0315D56111413A473F7BC2D8EE92326C8869C6745CF537EF2F52D4DFBA329F529DB113F621A02B47D0F1867400A3D706854AB09720D5594')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_DBEFF5CB5785591B0ED452E792471B1C638B40044F74CB77C9A7EE41977A9BCEA72A52E56C732FC92EF5B492E610298D76319981A87FA6312221449924455CAA4CCC3D7CAA66AC731A3D4727FC02B84B3CD985EA93574A0AD2BCCF87C22E8FFD2B4F79F050C852B7145EAA7D25AC302D0307876A1EE92A077B74CCFDBFDD3BB2D419C3655B993E70870F4F19C1E5DA153646D6C08DBA4D1E194F63091A126FAB78FD97E71CD5EEBEF8D352291BBB39949204F5A83B5A9AC789F0BBCC5E61316059D87A053D034ED50BD6DA84921BD708C89FFB64ADFD59293FE6B4E18E0E575D6052C9DB84F825D35CF3C00C926092509F1EFCED126C9DEA372C8464C093E1918E393DCDCC3714B79C5E9502109151A67355FD217B6DEFB102C7FB669959955A216AC1E1BBA540773A3E511779B6E019F14DBAFD8E6858435D11C2C24A1FCCDB06DC798185EFB47311ED25E03BF4971159A065D4CD78E5B3D6BD79A236762FD1811E5B00B6F9354FBF2D631918B38EECBDACC59E7DC66A02ACEE9D27D6D7BCBC4DD9D188D0A01BBD1CB5688ED199BEBA56CBB7A0BDB64C373B454DBE7EB2DB9675610516EA6C53D12642A20B1B2F88AF25859C341A4EB038AE5DEA07EF2028D4052F2340FA419F2FEA697D41963D63C34AD5CDFB240DA57D6F7507A8669405548E692100AE816630508C1A97F2A576445C6E5DD6867638872B50C0A5B3F1B63FE7C3C8FCB9ADE7EBE50E13566FA602DA461CC6EA913669D10D246D2EDD3E745C5331CFC4574F3E8C783F90A792C0090599E51F027A3872B394CF82DBAFBA71672A3A9A2F61FF03F718DE556BDDD2D0B626F1B59D8192854B18F02E914CB779D4EDBC0F2FE1E0FCF0A66C3E2F32B137742F192E77A81A88D4D3687FE14DD1A15516EC430989E196B614776B3312C6C5F84E85E6B6B1F2A11284D6CEF028A345BE51C51AE0709BFA8CA2C9090CA0315D56111413A473F7BC2D8EE92326C8869C6745CF537EF2F52D4DFBA329F529DB113F621A02B47D0F1867400A3D706854AB09720D5594'
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
