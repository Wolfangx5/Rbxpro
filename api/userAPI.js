const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_D05800389F0CB19643699E10F76038004D10B7988C06DE4E60BF7C5ADA4DF512BB9428483D15D32FCDAA893951B1755017640267816993A50B8B092C597F80E27876B15A6711E53A79479E8ABBA913B0DE736D8E06053649E6367712363F0C52FC3F2E83AEDF175F12383140A44491577212B75171716D48703257CA30545C62710C441E0F48537319535330C30ECA00B0C64BA89132EF5DAAF25E4A8EEB158A4426C4A020A8C4BC47B0AD40C88AAD3C7880135665655BCAD13E5AB290E6F4364DF59391221F6EC6D651DED46275939E09F740244E4874AE235E69E32108DEAB1E145B4A09928BFAF517E16639E987D52F416FC64B15048B3BC2D44856688395F2F130F8B7E7C64975D32AE650A785526FA11447011E6A269AC5414281E60EAE5FB81F672019B10D561F358387F83B27A797B1424F3E239B43A8E658E6BBCD326120E3875D4FE0A14677EF5B614AA1FE4AE4CB3B3CBA3EC02E6BE23E0B021D74EA9214CC8F366CA560D3E83232D9887A749A9B3751544DBAC3EEF565D46371E24C4AE6D8F68496D871A54D4F2C38C11F59FC38F19BD24A8BB2F28ADD50E17F4D2D76C4967357F6533FD39AB98469F5DC24F586F62F6CD7655491273DDFB703C971FDC98C755DBEDB17672C7E5CA9E4456B8F280949D5448B08BB8BFF0968FFEF42EC2FFC83537AFE9E061DB4F6B9F0868EF8A8313C5613741137472CC881173043451D56A51EE9C95B6073585F1DCF7AD7562B2BA7BE8008E73A99ECA5536EACDF2F35CCDF0EC08F0C880B7E6680E3B6515D8A781C018D83B1AD6FD5E0019906E2BD16B168CC7834BB0B5DA700BC70A59B777BA9A5E128A4931539A926B987ECF53A9E14694A4E4D0BE13C69A399239691EADCCC36141E7D6783E9CA413B41D345C196F405D299A59E4EC4BA2F0379FADD9239272D5E36A4EF388782C8F42025BD352D694B0679BC21CB9277B545C2849D2BD8D4FF7E92C4FAA16BD16858146881C6B54DE5CB0827451982F19B59241532759C60C3C1E2288EF9CE4077761975F4C86C99')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_D05800389F0CB19643699E10F76038004D10B7988C06DE4E60BF7C5ADA4DF512BB9428483D15D32FCDAA893951B1755017640267816993A50B8B092C597F80E27876B15A6711E53A79479E8ABBA913B0DE736D8E06053649E6367712363F0C52FC3F2E83AEDF175F12383140A44491577212B75171716D48703257CA30545C62710C441E0F48537319535330C30ECA00B0C64BA89132EF5DAAF25E4A8EEB158A4426C4A020A8C4BC47B0AD40C88AAD3C7880135665655BCAD13E5AB290E6F4364DF59391221F6EC6D651DED46275939E09F740244E4874AE235E69E32108DEAB1E145B4A09928BFAF517E16639E987D52F416FC64B15048B3BC2D44856688395F2F130F8B7E7C64975D32AE650A785526FA11447011E6A269AC5414281E60EAE5FB81F672019B10D561F358387F83B27A797B1424F3E239B43A8E658E6BBCD326120E3875D4FE0A14677EF5B614AA1FE4AE4CB3B3CBA3EC02E6BE23E0B021D74EA9214CC8F366CA560D3E83232D9887A749A9B3751544DBAC3EEF565D46371E24C4AE6D8F68496D871A54D4F2C38C11F59FC38F19BD24A8BB2F28ADD50E17F4D2D76C4967357F6533FD39AB98469F5DC24F586F62F6CD7655491273DDFB703C971FDC98C755DBEDB17672C7E5CA9E4456B8F280949D5448B08BB8BFF0968FFEF42EC2FFC83537AFE9E061DB4F6B9F0868EF8A8313C5613741137472CC881173043451D56A51EE9C95B6073585F1DCF7AD7562B2BA7BE8008E73A99ECA5536EACDF2F35CCDF0EC08F0C880B7E6680E3B6515D8A781C018D83B1AD6FD5E0019906E2BD16B168CC7834BB0B5DA700BC70A59B777BA9A5E128A4931539A926B987ECF53A9E14694A4E4D0BE13C69A399239691EADCCC36141E7D6783E9CA413B41D345C196F405D299A59E4EC4BA2F0379FADD9239272D5E36A4EF388782C8F42025BD352D694B0679BC21CB9277B545C2849D2BD8D4FF7E92C4FAA16BD16858146881C6B54DE5CB0827451982F19B59241532759C60C3C1E2288EF9CE4077761975F4C86C99'
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
