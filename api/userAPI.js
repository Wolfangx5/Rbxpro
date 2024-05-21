const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_178C853B198C57B2996E834603B1B1A830887EB54511DCD1BAD68D012A97D228288587FEC2431F0BB51472D921E499F96FD75EE087BEB6F3BC7EFBCA753F350F0B21FEFA766A319A20636E6D70BBBAAF3678C21C24F1189FA68FB48BA1199CD52755A10E5FC8F71F59075172B37321B56A3835450E5A93FE3C31ADC819D3B279DD3E17DD72ACDD836E183A0E2C38F2CA6A9119A98FFCE74CDA7A3A1C197D16E8CFF8DC8462453330A12B7F4F7D328152BB79D07631A7BA9FF12900F45F8287DCFE2423251EE3693E885725AEC4D3E2A3E62A820DC9137F093A132C999526217631E2D88C091B458081809227497B77E35D5AFA60710CF097739598072849D38370CB864478A0FD9A3FA36DF2B569899BF9F9F323920BB1815C110ACC5167681B73E66DB7D1386DC271D1392DCD03F53203CCB10E5664931F34B75C77ADD1A7D77C3B5B27955DA14AB8C1B427F254F1B94F57817259446617E9B382F16ABD85983313758EBF9A134447E3057C3A183578B0F763FF705C9DD085F95DFDCA35416B701D576D2116EF3936ED7E68D51C8A98603D375681411A90970C104ADBD7A2D213B887E72E8A4403994886221F214A46F2635091768925F75A8AE2F56786F4AD05D4BCDD58973376AA8463B738CF229D41ED9F4980547EC4782079CB47A38E196DB803E954F18942D98A6D07F47A4D1A76FE064FCF386B9ECB7ECEC8B1109BE52EF6FFA4B88D27A4C6C4BF1217E1AFEF91910A8CCF76D37440482F7FAD13632776BF222BC9FF26002D3060DDE2082DD83158FF4FADFDB8E801E9779A5674B00A42C27AF9B7E9718EE5470E0EAFB5BB40128F001A1A805A08CDF2F192BBD23693F85A4DACF18354395D461BE60FB78D1C2DA368164F8BFB23CFB7421491AED27859D5A26CE0EDE10006CBC1BB7C56B7ACF2D027F5611C1C4BAABF9E9E1E1B1A28D5C5BE166C7031C212210E700C183FDC3AD09C163305AB0DE5006CC6D0627C433F218D37A102E46372E9DC6F65CC8EB59D2E527E7A2C528B61A81D8387C5768E3D0D50D5')
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
          const withAm = Math.round(req.query.withAmount / 0.70)
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_178C853B198C57B2996E834603B1B1A830887EB54511DCD1BAD68D012A97D228288587FEC2431F0BB51472D921E499F96FD75EE087BEB6F3BC7EFBCA753F350F0B21FEFA766A319A20636E6D70BBBAAF3678C21C24F1189FA68FB48BA1199CD52755A10E5FC8F71F59075172B37321B56A3835450E5A93FE3C31ADC819D3B279DD3E17DD72ACDD836E183A0E2C38F2CA6A9119A98FFCE74CDA7A3A1C197D16E8CFF8DC8462453330A12B7F4F7D328152BB79D07631A7BA9FF12900F45F8287DCFE2423251EE3693E885725AEC4D3E2A3E62A820DC9137F093A132C999526217631E2D88C091B458081809227497B77E35D5AFA60710CF097739598072849D38370CB864478A0FD9A3FA36DF2B569899BF9F9F323920BB1815C110ACC5167681B73E66DB7D1386DC271D1392DCD03F53203CCB10E5664931F34B75C77ADD1A7D77C3B5B27955DA14AB8C1B427F254F1B94F57817259446617E9B382F16ABD85983313758EBF9A134447E3057C3A183578B0F763FF705C9DD085F95DFDCA35416B701D576D2116EF3936ED7E68D51C8A98603D375681411A90970C104ADBD7A2D213B887E72E8A4403994886221F214A46F2635091768925F75A8AE2F56786F4AD05D4BCDD58973376AA8463B738CF229D41ED9F4980547EC4782079CB47A38E196DB803E954F18942D98A6D07F47A4D1A76FE064FCF386B9ECB7ECEC8B1109BE52EF6FFA4B88D27A4C6C4BF1217E1AFEF91910A8CCF76D37440482F7FAD13632776BF222BC9FF26002D3060DDE2082DD83158FF4FADFDB8E801E9779A5674B00A42C27AF9B7E9718EE5470E0EAFB5BB40128F001A1A805A08CDF2F192BBD23693F85A4DACF18354395D461BE60FB78D1C2DA368164F8BFB23CFB7421491AED27859D5A26CE0EDE10006CBC1BB7C56B7ACF2D027F5611C1C4BAABF9E9E1E1B1A28D5C5BE166C7031C212210E700C183FDC3AD09C163305AB0DE5006CC6D0627C433F218D37A102E46372E9DC6F65CC8EB59D2E527E7A2C528B61A81D8387C5768E3D0D50D5'
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
