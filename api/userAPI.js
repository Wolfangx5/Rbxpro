const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_31A27D4FBBE28FE066BB8BC5DE4149DBEB1C5B8480D8B920356A0B5CD293EC14C09C869E4FD633875644CB105F4F228156F7B50F6A1C3FF3D5937632CD38AF95E43FB4F2418E0025BDEC44BB3F3EAFBEA803AADA438FFA204E638A75077491E7F0F85DFFC22E9F6BC2FFD616D3E041B08CF6E6529974FEC9617FEA6A5BDD75CDDE1DE76EBF9E08028D156ACD66B3D8A711F9BDD104C191A7F84E5525452002D887C541EE88D01601E47B2F2821BB13D2CB5685BD1A9E11D149A769FE7F332CD058A01E115CACED388651C843210B1CF0B1DEB0B13CEAA7C1013EAB195D57717BD01A4A685A7702B177A45B4607D970F232B17A1F4900D4E8882533A7D587BEB549C0787CCD62D547650A6AD8D692053B53B1AD9DCECEA8584AFA2E5FEA49363412D3F292F17F244C9A4DD37B4A118D9C25671B2F8222E6464756F0FE6942C4B664349D23109832C5DC9553DC35CF0AFEC9947AF9AE1FAF11165536EC73419A9AC87F065D2FEF66CCC7214FC802728C1661A93580565AE21BBF3C4D932F94D60109DF4CB03AFA7B4F72B842C3B4F08FA67F997C312B8BFD72BB500B67B803791E053887EC0168A1EABCDBF9811D3C6482DEF0535F12BF9F9498BBEB72A557D40C5A17384E7A69BDB2416DF80E108F11A5C08104053301565B967440F68322104033D51DFEF238EDD7F6782B01315AD74E48F102FEBDE0F90818D5A11168ACA899ECF0F3E80C169D7B33616845DEF4F43E9ACA369BA82DCAA9D0C4E9F171C2537A46D679F7FC59BCB5A2BB54C2440EBD04FE34311185A8478439F6F8905A1E2B4C5C87D1F44946996BB2A8DDAB6A05DEB03588D95B906289471016E7A7C2603088699286E3AABA796BB89360F167D9458CAD18FE482A18AFE673C385F66B476C081FB427A166FA548B4B6D03B37FB456A526DC671B')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_1AD522341754E11597471E132170917463D6FFE3AF2F246620F9A114597012765E44038FB527B314B15803E21BFC5659EB5D4D9E98CF3EE46208ADCEEAF79B9573030AB428690354CA05AA4A1F5D64EA4B1F0E31AA4A4533C3D7DCE9D72CFCC8AF068D94FEA291811D6A585962E98EC904DD57DD118B741A36AF7E9FF20E939BCF8F0C80A011098E43ED806B8E382A628082C934CB107C2E918EC0F4B991F7DF2AC616F8141FE688D44E106E12C4C5F2DF1C4B24200315F806F4FC34E79957D332C49F9FD2B3CD605DAE6EA4F3F6E17F5B9548460F972FF50446A6B212CCC666E3D064755432165B825153D1D358462AB34E67CD6C1C23D731CE73A4461DA448C03E9A017D8E0DAF22893055F7D3796C705B3534D2CBC63E4BDC662D3AE32AD9A8D9D2E499D5033D5689249688288759E810C17A4D85A407D0409EE586CFDA78FBE03291813537339A526508586EEF7FE915CF773CA48E6FFFB613B27EC0239B88BEABEE4F86375B883D327B3888B3E360DA1862A79B8E1D447A1EB04A33CD5C1423146C4C9E14EDB098146E9A6B91AA1CBB9CEEA98B8E4BE82F1801F79B5C1E4A868897A61A1BE65A89CFA8A4126322DF77243E0FB2315F535F11C5C0699CC1974F4A1C482D82C9C190D6ACD8EC6CBDA4D1CA12511577951026649EC2E629C7EF14672376929F2D334BC11C2449341AB3909CA439671CF6FDA628400458519131E6179BAC830C85C512DF743E06AC146FC7305E05015AD57F2E9D4CC4DA9ED769C6DF588CA7382332C14FF0670EC6A69C27737DAFEFCC78DB49491E9B4EBF1A05088546103C825677A01BD4AC53B2F6133D031E6F14D4EF24E9AA070D761C648FDE8CE96737D4955E2112CCC9B0757D9FEFB2AEE129DC2F6EA9F588B6FFCA587690DDDAD910741F767EFA0A58004B464B6812D1'
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
