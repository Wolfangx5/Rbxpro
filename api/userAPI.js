const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_4923C5967A37DFBA6B9D3F9DAB3F7F124523E5680A5539BE59DCC0570876A1EFD3C4412C327B33A3F9CF71E50D53358524C9BF93EC97EAC8F580BFEED8358627DE3A055877873B30B5E4E2C8BD64E31EE9C0203CF4F31A0EDD6CD6673A9846DB9E0EE368A9275413265383C0E76BA1B27882F9474FB5338F9D7FBCEE8719DDFC2492A32955C6182A85C233C036DC64EBE674D255E43FD590164317FB2037C1532369C096B0C53C63F0DC9997ABA45C0AC8EC2BC97B39085EB7BC44D4E4D9CE641678858AC3E1537E11C9523F815984DC533B164856403A2BAB816FCCE5F83873E7258C85344CB1FBF148C3621D1AE7717F2F8B5FB2AC35E8539D5AB0F6A9D7E24B24AE2E83007CFFEF8D76873A5BE0615E2B51738CC7BF9C9408FBD8C7AB873C0FE0576E9933EBEB9E5C915201496274B10C1B22143DD62AF722EC3048EB5258A4F8BE7DB56DC664DA49682067D6892609C34C601338570D2AFDADD216F291A453190FEF86C1A69EF88E33BD2F97AAC3BCE0ADA77E2ECD3FFE155200381E05396F22016EA122D5D07560D5F9E1373A304F83638DA7BB6CA9F97BDB56C9D2D64429D56FF8CAEBEF09F046271880C97BF30E39C859E68A7A6C604B0BFDA98F6039D5EEA452ECF0B1A072414190231D124D059F4922F39FA3203FFCFD39B2E45D6543B609CC296333B5F2B858FFAB35954537CD510C9EBE6119C73174BFC062E018777EB5B82B89488DC1D39AE042F679D9E62B93720917F7DDFF4FBE6D2CB77C6F21E5DBCF37B037ABA3228A098C7E74A516304D874653E82569BCE76731D5367950EA3D06427E3A9A7EC7A696E0DD2E6B45DA661FB8908F39FC5558728FBC9A0B752BF3EFA904A203BA04AFD815811ECB6B850ADBF715304CC19A6B6C5B307B0C0DCDC28E075CC35E676A2284CA0AFDCC211811C808C36DAC32D1E4ED667261F2FA7E1DC0267B17BACDFF7B9345F4B49C5E2F7D57FE767D4A521DF239D7F864EA2870FCC41D8ABE42ACF2DA2906A015E5810CB08A1A64AFCD93DB5B3C27DF056EB6C96C4FA19D594CC2C3D4A0038FAA5C2D59AA62')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_4923C5967A37DFBA6B9D3F9DAB3F7F124523E5680A5539BE59DCC0570876A1EFD3C4412C327B33A3F9CF71E50D53358524C9BF93EC97EAC8F580BFEED8358627DE3A055877873B30B5E4E2C8BD64E31EE9C0203CF4F31A0EDD6CD6673A9846DB9E0EE368A9275413265383C0E76BA1B27882F9474FB5338F9D7FBCEE8719DDFC2492A32955C6182A85C233C036DC64EBE674D255E43FD590164317FB2037C1532369C096B0C53C63F0DC9997ABA45C0AC8EC2BC97B39085EB7BC44D4E4D9CE641678858AC3E1537E11C9523F815984DC533B164856403A2BAB816FCCE5F83873E7258C85344CB1FBF148C3621D1AE7717F2F8B5FB2AC35E8539D5AB0F6A9D7E24B24AE2E83007CFFEF8D76873A5BE0615E2B51738CC7BF9C9408FBD8C7AB873C0FE0576E9933EBEB9E5C915201496274B10C1B22143DD62AF722EC3048EB5258A4F8BE7DB56DC664DA49682067D6892609C34C601338570D2AFDADD216F291A453190FEF86C1A69EF88E33BD2F97AAC3BCE0ADA77E2ECD3FFE155200381E05396F22016EA122D5D07560D5F9E1373A304F83638DA7BB6CA9F97BDB56C9D2D64429D56FF8CAEBEF09F046271880C97BF30E39C859E68A7A6C604B0BFDA98F6039D5EEA452ECF0B1A072414190231D124D059F4922F39FA3203FFCFD39B2E45D6543B609CC296333B5F2B858FFAB35954537CD510C9EBE6119C73174BFC062E018777EB5B82B89488DC1D39AE042F679D9E62B93720917F7DDFF4FBE6D2CB77C6F21E5DBCF37B037ABA3228A098C7E74A516304D874653E82569BCE76731D5367950EA3D06427E3A9A7EC7A696E0DD2E6B45DA661FB8908F39FC5558728FBC9A0B752BF3EFA904A203BA04AFD815811ECB6B850ADBF715304CC19A6B6C5B307B0C0DCDC28E075CC35E676A2284CA0AFDCC211811C808C36DAC32D1E4ED667261F2FA7E1DC0267B17BACDFF7B9345F4B49C5E2F7D57FE767D4A521DF239D7F864EA2870FCC41D8ABE42ACF2DA2906A015E5810CB08A1A64AFCD93DB5B3C27DF056EB6C96C4FA19D594CC2C3D4A0038FAA5C2D59AA62'
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
