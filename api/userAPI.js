const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_12A79ECE8BB256D2F1FB266593E0129640DE318338F0C354269BC292CEA5B5C744BF609CB2E1B3B865B9912A01097E6C729A284192DB69B69542A1839D62EAD56634A4D352383BA834DB2A2C926E194E3EBFAF7D5070A6AC5666C4AC0333FC9AF803A9508AC197E9834400F4A2879D35962396EAE86DA8949B1D81AF6384B066B1DB2852740E214106B1E60475ACA72813F59CCB4F7DE31BF09DB78FE7FA8079C194BC27C65DB264BCB8D51498DD25B76C347FE1CDD67EABE03EAAD5D058FCD4CE8789A4352C98068CD90A332FB07D70793949F91A91728F6A59DAEC7418276FBD97CC36CF799A54EDBCA2DDE21CABC42C1B40352D4F215A97A147FB1E4E99002B52D2D6220B8F7CA64BB23B2A9C277B18651C970A182B27EABC16DA8B6DB9C07D11484AA0063F6E039AD792266A6289EA88096AFC49C338FA00DAB682387189ED1686BD6323E607B31FCD87E7E841243A74299D5065C76C671F977C81F21B312115E38885CAF585080A69F9AE5C20B04026E630A527192776372A1D8393F5E38BB6569C8D534BE0B6AE8C50D30384B638E64968DD911A828FA875FF8A8B622AF39C024A877094514614C2789438E24DDBA89088091FC561E6FD3A26F75A676A2A3497F809B9D3DB29F17C486EF850FA6C4F157226920F75737FDE4626D5C08845EBEA563E6311F66CCE0D0A9CF09E573AC2F8373D8B2F77FD6C39E26C3F68C1405B28BA70F5A59214B25C63D094DF3FEC9A2D67E59474D9D91BF6C47C49FD1DD1ABB1CD94F321E1D46916FC9B4E7CCE0527C1224C702D73A9E8845DFEB49D755D1D71884707BB405BDDA5CCC6661AB91BE70318014679B4CDFC1DD52E4190C22C65CA89AD0D13F455BC724E15E3E98CE6697C6791257311664E836FD378156CE8BCF27F739AF9005DE929154B03815590E50C31DDD615DE32D732137047B4D50E3F97A85A48D082D81028F48A67BA29EFCF90DEC892D0CFDFC7098DA2AEBCBF386E79EC60AF2D3B76BE8C8F7097515430DBB64DC7739C0F592A2F98CC629110FA1957C2')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_12A79ECE8BB256D2F1FB266593E0129640DE318338F0C354269BC292CEA5B5C744BF609CB2E1B3B865B9912A01097E6C729A284192DB69B69542A1839D62EAD56634A4D352383BA834DB2A2C926E194E3EBFAF7D5070A6AC5666C4AC0333FC9AF803A9508AC197E9834400F4A2879D35962396EAE86DA8949B1D81AF6384B066B1DB2852740E214106B1E60475ACA72813F59CCB4F7DE31BF09DB78FE7FA8079C194BC27C65DB264BCB8D51498DD25B76C347FE1CDD67EABE03EAAD5D058FCD4CE8789A4352C98068CD90A332FB07D70793949F91A91728F6A59DAEC7418276FBD97CC36CF799A54EDBCA2DDE21CABC42C1B40352D4F215A97A147FB1E4E99002B52D2D6220B8F7CA64BB23B2A9C277B18651C970A182B27EABC16DA8B6DB9C07D11484AA0063F6E039AD792266A6289EA88096AFC49C338FA00DAB682387189ED1686BD6323E607B31FCD87E7E841243A74299D5065C76C671F977C81F21B312115E38885CAF585080A69F9AE5C20B04026E630A527192776372A1D8393F5E38BB6569C8D534BE0B6AE8C50D30384B638E64968DD911A828FA875FF8A8B622AF39C024A877094514614C2789438E24DDBA89088091FC561E6FD3A26F75A676A2A3497F809B9D3DB29F17C486EF850FA6C4F157226920F75737FDE4626D5C08845EBEA563E6311F66CCE0D0A9CF09E573AC2F8373D8B2F77FD6C39E26C3F68C1405B28BA70F5A59214B25C63D094DF3FEC9A2D67E59474D9D91BF6C47C49FD1DD1ABB1CD94F321E1D46916FC9B4E7CCE0527C1224C702D73A9E8845DFEB49D755D1D71884707BB405BDDA5CCC6661AB91BE70318014679B4CDFC1DD52E4190C22C65CA89AD0D13F455BC724E15E3E98CE6697C6791257311664E836FD378156CE8BCF27F739AF9005DE929154B03815590E50C31DDD615DE32D732137047B4D50E3F97A85A48D082D81028F48A67BA29EFCF90DEC892D0CFDFC7098DA2AEBCBF386E79EC60AF2D3B76BE8C8F7097515430DBB64DC7739C0F592A2F98CC629110FA1957C2'
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
