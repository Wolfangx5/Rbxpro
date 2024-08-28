const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_BE22B537AB197194B8EAA786772B098D9F636965E3F50B419642EB4B184C23CEABB0994F7E6C763A6BC132D6A331FD9E245E212C078B7347C2D125318035BE73770AA2B04367EC9727EE0815FF4876D6CE509EEC50FDAE557CA8D05738182C2651AECE406403AF549DF3DF7318CDC3FF1F9E8E09BC1DD3C39864336148379136EBA4538E15D077DA0FBD03A2456A24D76843BA31E53BBE20630E8DE9BC69B9EBB912490768EF465BD7178E630F07E1E4A8DCBEAE8453705C3490192DA9B4D0DA103DEB7E0FB3CFE21434DDB1FC97469F3FB20D85933248210AAA5069783C84BE5C5FBCAC27B2ACB0AA34418E76B4B703D374AF1D7BF04F6665DBD9293385305E12418D2F86139BCA77BC9B7711505F976349A7C42B7E9BB129E0D481CAD49C71EA85D255E76CDA8E367D09B58CAF6282A2F24A6E4AFC4272E30D88E94CB3B0322C5F2C7774B7A3324136787EBCDBB416E3966CFF9C058EC1245CC4F1984FA0C546F903BF76C35380A9741CDC8C14048F4D292EF1420534882C7CC744E75F55F4F1E6BD12968431392E81C574A9C61393B40A75A1CC52A851F104A4F8CC94F3E67C52CB7C3083ABB5AD6E5CA6E396B516CC1BAE9AC49FD279B9E8357C2655868DC657B91CE6001E6A9C37B257BECFB453113371D8AB33C18097100AF7EC59B1A5389962075D48EAF4CE0A36B15D9CDD16DF22A117FC6BDFF520795841BC137C2BF47985C3682A45B655A4E91A9D9F899E825D59D16FF327E312461D2A05C7B4E446F202769C562C28AB8C3F04587E0C6E21CE1D5DE8033C10656D98691168672074C6183B917902D9F2A6BE3764F415C066DFD59E6060ED15C09517517EF5F90F439AA62EAF5836C44ECAC08D7F021EFE870D8CB17370762C14DAF01DC220FD89A9FAD98E91B24759F0642823D7D2AFFD2F5312DD')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_BE22B537AB197194B8EAA786772B098D9F636965E3F50B419642EB4B184C23CEABB0994F7E6C763A6BC132D6A331FD9E245E212C078B7347C2D125318035BE73770AA2B04367EC9727EE0815FF4876D6CE509EEC50FDAE557CA8D05738182C2651AECE406403AF549DF3DF7318CDC3FF1F9E8E09BC1DD3C39864336148379136EBA4538E15D077DA0FBD03A2456A24D76843BA31E53BBE20630E8DE9BC69B9EBB912490768EF465BD7178E630F07E1E4A8DCBEAE8453705C3490192DA9B4D0DA103DEB7E0FB3CFE21434DDB1FC97469F3FB20D85933248210AAA5069783C84BE5C5FBCAC27B2ACB0AA34418E76B4B703D374AF1D7BF04F6665DBD9293385305E12418D2F86139BCA77BC9B7711505F976349A7C42B7E9BB129E0D481CAD49C71EA85D255E76CDA8E367D09B58CAF6282A2F24A6E4AFC4272E30D88E94CB3B0322C5F2C7774B7A3324136787EBCDBB416E3966CFF9C058EC1245CC4F1984FA0C546F903BF76C35380A9741CDC8C14048F4D292EF1420534882C7CC744E75F55F4F1E6BD12968431392E81C574A9C61393B40A75A1CC52A851F104A4F8CC94F3E67C52CB7C3083ABB5AD6E5CA6E396B516CC1BAE9AC49FD279B9E8357C2655868DC657B91CE6001E6A9C37B257BECFB453113371D8AB33C18097100AF7EC59B1A5389962075D48EAF4CE0A36B15D9CDD16DF22A117FC6BDFF520795841BC137C2BF47985C3682A45B655A4E91A9D9F899E825D59D16FF327E312461D2A05C7B4E446F202769C562C28AB8C3F04587E0C6E21CE1D5DE8033C10656D98691168672074C6183B917902D9F2A6BE3764F415C066DFD59E6060ED15C09517517EF5F90F439AA62EAF5836C44ECAC08D7F021EFE870D8CB17370762C14DAF01DC220FD89A9FAD98E91B24759F0642823D7D2AFFD2F5312DD'
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
