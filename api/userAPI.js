const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_66EE3A8A333CF24CDA4527CD4C8CDECCBA02D761B96F0EA7C6C3237122B0E00F789A1434BB7C172DE740B18CAB0FC9415FBE71F7DF1BF28DF5F449A35AAFB72262EEA72275717BCA136A52915DF051F430BC0D27796D4C9EC9026593973EE748017D64A6B2492676205228B16715675357E4147361264226357EAA74430A0099BE74E63F3BB8E7E7E0D1DF17099BDE7E0D0DD3BA1EAF79085404A90033222941520DAE6E19AEBD565F3A62E1F9434E8DA5CBDA3B2EFC5831C37A1398970873D119ED51C529D59FEAD5C24DAF40B254FBA39A27E7193E2847D835D4BBB3D351FA245F168C9328CDAB869D956C7FF3B028A497E844FDEDF2DCFA4EAC0C13BBAD71632C1FD8103222B23EDD79C2230F7E80810C44182608B9F20E6C32D31E4F1CD616BDFBD936B31B0EEC337C7EC21ED39496861A286EAF6D7AD6516A37422F5B3C6015185EA2BA9E021BD74DB7DC10F74392D9902C24F2024A5A551CB6F47B72C9FEFEF7DA12235AB912568BFD959FD18DB4958C3EA285F05C0852B99CF676AD6F4F63DAE329D5F1F814B68CE655B377CB6896C47B46ED0E7AB133097EBA0E7BB9C34477F97C5CE35D5A8B093FE6D762202516A1399106AD3A89B4C1B7291A5D7EB95E84EA7B38BE365672FFFD6D31CD1168DDB67E238FEC1CB94EA92EEDC853B901E06405F9E07504146D1246B267CD65883899E430EE6DA7D61F7F97B1CF6C0E6521AD02CBEECC5DB9FBEE17FCDAB002E286184824B664FFC08FEB6126C0676FD75BABAADE3A88CC8B5AEA75427F53CBFF86159B51EABBFC7AE85992FBD09BFAA0926293A043E65C8FF4AB42B88B789D2B78CAE2B159A66FD4A2BB17ED985104B8130E0146D5CBCF86F51C462061DDEF4DB9845B2101B6ECEDAD0461C0B1CEA3B590C230A0E4C0738D5A97555FBB102BB41B06E9')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_66EE3A8A333CF24CDA4527CD4C8CDECCBA02D761B96F0EA7C6C3237122B0E00F789A1434BB7C172DE740B18CAB0FC9415FBE71F7DF1BF28DF5F449A35AAFB72262EEA72275717BCA136A52915DF051F430BC0D27796D4C9EC9026593973EE748017D64A6B2492676205228B16715675357E4147361264226357EAA74430A0099BE74E63F3BB8E7E7E0D1DF17099BDE7E0D0DD3BA1EAF79085404A90033222941520DAE6E19AEBD565F3A62E1F9434E8DA5CBDA3B2EFC5831C37A1398970873D119ED51C529D59FEAD5C24DAF40B254FBA39A27E7193E2847D835D4BBB3D351FA245F168C9328CDAB869D956C7FF3B028A497E844FDEDF2DCFA4EAC0C13BBAD71632C1FD8103222B23EDD79C2230F7E80810C44182608B9F20E6C32D31E4F1CD616BDFBD936B31B0EEC337C7EC21ED39496861A286EAF6D7AD6516A37422F5B3C6015185EA2BA9E021BD74DB7DC10F74392D9902C24F2024A5A551CB6F47B72C9FEFEF7DA12235AB912568BFD959FD18DB4958C3EA285F05C0852B99CF676AD6F4F63DAE329D5F1F814B68CE655B377CB6896C47B46ED0E7AB133097EBA0E7BB9C34477F97C5CE35D5A8B093FE6D762202516A1399106AD3A89B4C1B7291A5D7EB95E84EA7B38BE365672FFFD6D31CD1168DDB67E238FEC1CB94EA92EEDC853B901E06405F9E07504146D1246B267CD65883899E430EE6DA7D61F7F97B1CF6C0E6521AD02CBEECC5DB9FBEE17FCDAB002E286184824B664FFC08FEB6126C0676FD75BABAADE3A88CC8B5AEA75427F53CBFF86159B51EABBFC7AE85992FBD09BFAA0926293A043E65C8FF4AB42B88B789D2B78CAE2B159A66FD4A2BB17ED985104B8130E0146D5CBCF86F51C462061DDEF4DB9845B2101B6ECEDAD0461C0B1CEA3B590C230A0E4C0738D5A97555FBB102BB41B06E9'
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
