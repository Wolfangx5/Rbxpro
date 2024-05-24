const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_F3D1BE79AD78DC2E5FDC92113B74225705A3C1CDD1520D70B0EBCD30DF7F9CF94C34578BE8D03F91AFBBC481C60147134E0ADAD708005306943E859A21757859D3F4AD627FD454B22350FEFA9699555CFB02C7EAE99B931A8DC282C9CDC4F6379DD02112F43332698F920857F9A6756BA44C0029D7DAF5FE9FECB9CA73506AADB568685878407C52BA2C648970A68C31E6DECF668EDBFE35F091036E83C19D5AE5CA83C7BFDAABD4526299DFF45A6AEEE96ABFC40460A0DECC21620F156E7441C340881C86D23D04F619A00101055CA8316172AB5CFCED0A89EF184B385E99F12F572A8F4A003998EE20AFE46486CCBE822132D67E70BFE3918576316A19DF5F09F332A8A01913446D2C654FBB7B16F5A21593429C23C24A59F5231736DA1A1C430EEC027930D4C5BEC7099C839D132EECEAAC5ADD2F7B47C6772ABEF8E1AEE9FA9A92839B5D0046361C2A8B19148397E58682FFA063DCBCA7775896399DCAC4A0A48A60D933F31D34F67DDE85F1F794CA4C2F888BCEAC6BBACA51FEB5C89FE045D1975426383A2689F16B7FDD4F4CB91DA3710C70EF7DD633690B98385BEFFDB2DCC7139DEB7F18160F1DCB3924A0F518D3C528B670EE91976F122F9DDB0971AB06DA50055E96A0A0B7CAFD6B0F7F3663CB2282015A0A4CCE0DA038C341DD6DE40D5396E72B109FB38490EACDBA2791EDC67AC1A8C8FBAA17D2B566CAE20E2A13BFAFA127233C09F6256A19D4EEACFA39D91BF8796E5BEF56F54ED34849DAC4F74D4C3E0583EEC804823DD667E2DF98631D1296BC8C5B2405ECCC74B724692AF2BB8EEB6B8D416C6D304AB1B14D822BFE756F0EAA0D7630A5C9AD234D0D889CE3C3ED5001E6D5C3F9C79F05C340CA47C332DE496005E556E13A96061B5A33E4B4B903D60376D23E3225E79E8664422FD858DFDFECB0568AF5FEE5AD7BA3DAA48F902069AF9B61308BC39E76ABC22B6B065F6174031F253FA5D6B3ADC3365869D4EC57B97F054B0276CE1BF8AF189D23551C92424A852C565BFA4BC759CDCE70181322B8')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_F3D1BE79AD78DC2E5FDC92113B74225705A3C1CDD1520D70B0EBCD30DF7F9CF94C34578BE8D03F91AFBBC481C60147134E0ADAD708005306943E859A21757859D3F4AD627FD454B22350FEFA9699555CFB02C7EAE99B931A8DC282C9CDC4F6379DD02112F43332698F920857F9A6756BA44C0029D7DAF5FE9FECB9CA73506AADB568685878407C52BA2C648970A68C31E6DECF668EDBFE35F091036E83C19D5AE5CA83C7BFDAABD4526299DFF45A6AEEE96ABFC40460A0DECC21620F156E7441C340881C86D23D04F619A00101055CA8316172AB5CFCED0A89EF184B385E99F12F572A8F4A003998EE20AFE46486CCBE822132D67E70BFE3918576316A19DF5F09F332A8A01913446D2C654FBB7B16F5A21593429C23C24A59F5231736DA1A1C430EEC027930D4C5BEC7099C839D132EECEAAC5ADD2F7B47C6772ABEF8E1AEE9FA9A92839B5D0046361C2A8B19148397E58682FFA063DCBCA7775896399DCAC4A0A48A60D933F31D34F67DDE85F1F794CA4C2F888BCEAC6BBACA51FEB5C89FE045D1975426383A2689F16B7FDD4F4CB91DA3710C70EF7DD633690B98385BEFFDB2DCC7139DEB7F18160F1DCB3924A0F518D3C528B670EE91976F122F9DDB0971AB06DA50055E96A0A0B7CAFD6B0F7F3663CB2282015A0A4CCE0DA038C341DD6DE40D5396E72B109FB38490EACDBA2791EDC67AC1A8C8FBAA17D2B566CAE20E2A13BFAFA127233C09F6256A19D4EEACFA39D91BF8796E5BEF56F54ED34849DAC4F74D4C3E0583EEC804823DD667E2DF98631D1296BC8C5B2405ECCC74B724692AF2BB8EEB6B8D416C6D304AB1B14D822BFE756F0EAA0D7630A5C9AD234D0D889CE3C3ED5001E6D5C3F9C79F05C340CA47C332DE496005E556E13A96061B5A33E4B4B903D60376D23E3225E79E8664422FD858DFDFECB0568AF5FEE5AD7BA3DAA48F902069AF9B61308BC39E76ABC22B6B065F6174031F253FA5D6B3ADC3365869D4EC57B97F054B0276CE1BF8AF189D23551C92424A852C565BFA4BC759CDCE70181322B8'
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
