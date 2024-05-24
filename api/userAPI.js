const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_6826FD50E77EE05842D2D7FDA123C4238CA0F949CE238CC97A02BCCD055E13E96C55E70961B4CDBE48D70803FE49B48A914EF53D50BB923AC26A73B490663C6D201DAF783E7D5B4633001636691D41E0A7AC657AEA1FD4B4728E194D721C63F4FF365FB05E215227C9833411671C3A51A9DE771B2B5033D3804F9E63D9B85DC05CE32805FA109E071C2A7C8CB568BA24370E50248A0A44CBE578EA3F3FB7E29BBDA8DB324B55375A4081D88DB8A2B46F01C192E1D5E331A6501A237397C3C83FD74BD24322BCEB48804ED1C4460C875C626BF05E9B6D1F3B2354B083197A10273938F476311073C514B5EB53115886A538F9C68819678F9F40E0FDE0F9252C09C4940E58302F125E980A51CD673BE38A1E6AB5612E9769A54DD8E7A697C0730DF9683E9617A3329FFCAE9FB9397401AF13B09E54F779D661F2F37ABD2D8302BD247BA6B8DC661EB1FF878CD1351B27CB8BF9F403ABB04B73FCD0778B578F367A31EFFC78E86B5C9A23735644E1C3252747D01A68327A30D8EDEDAB5E263698791FEB8FBDF83E43EB6D826126E2418B763D1FEE89FE43DA55B87DD71E4DC796B3CCDBA4C0769B7BB5C079B5FE3E9D43F1A7D4E3405B8448373FBF162A83F1B51B29CF5CE93A20C4FEB9B5702493335890CDCE521FA7F6249FADEA65D846542977DD84735467D4BFAB7CF900C85D7307A9F1617AC0006EBDFE1A669BEDE73677422DB062EB7F75C00240A92416D064C0C072A6A7305E5CB55C258DD23B22236409459976BB24309355176F94E8C863406E4C6B781BC233F2FB4BFA983D2294CF162342CD48C3C8735472B8E9D74C7840E78CCBFA9ED8116F341698E61F3F3BB9143C87B1D8135BCFBC2926F193619228766528B93BF9558977AAC425AEE925AF20BCCC0EEA3E2B45806606E99C2F919E6BF81D585A7E23296021A1F4C63206F7B191A8FC4A7EAB47CC14123B5C3ED8A0F7A95512C3DADAE897BE31E857B3F6B55FCA3581E4573826D99F5AAE09D9AAA96FBE8BA88568D9CE290859EB36A17F72DD88C76E7C')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_6826FD50E77EE05842D2D7FDA123C4238CA0F949CE238CC97A02BCCD055E13E96C55E70961B4CDBE48D70803FE49B48A914EF53D50BB923AC26A73B490663C6D201DAF783E7D5B4633001636691D41E0A7AC657AEA1FD4B4728E194D721C63F4FF365FB05E215227C9833411671C3A51A9DE771B2B5033D3804F9E63D9B85DC05CE32805FA109E071C2A7C8CB568BA24370E50248A0A44CBE578EA3F3FB7E29BBDA8DB324B55375A4081D88DB8A2B46F01C192E1D5E331A6501A237397C3C83FD74BD24322BCEB48804ED1C4460C875C626BF05E9B6D1F3B2354B083197A10273938F476311073C514B5EB53115886A538F9C68819678F9F40E0FDE0F9252C09C4940E58302F125E980A51CD673BE38A1E6AB5612E9769A54DD8E7A697C0730DF9683E9617A3329FFCAE9FB9397401AF13B09E54F779D661F2F37ABD2D8302BD247BA6B8DC661EB1FF878CD1351B27CB8BF9F403ABB04B73FCD0778B578F367A31EFFC78E86B5C9A23735644E1C3252747D01A68327A30D8EDEDAB5E263698791FEB8FBDF83E43EB6D826126E2418B763D1FEE89FE43DA55B87DD71E4DC796B3CCDBA4C0769B7BB5C079B5FE3E9D43F1A7D4E3405B8448373FBF162A83F1B51B29CF5CE93A20C4FEB9B5702493335890CDCE521FA7F6249FADEA65D846542977DD84735467D4BFAB7CF900C85D7307A9F1617AC0006EBDFE1A669BEDE73677422DB062EB7F75C00240A92416D064C0C072A6A7305E5CB55C258DD23B22236409459976BB24309355176F94E8C863406E4C6B781BC233F2FB4BFA983D2294CF162342CD48C3C8735472B8E9D74C7840E78CCBFA9ED8116F341698E61F3F3BB9143C87B1D8135BCFBC2926F193619228766528B93BF9558977AAC425AEE925AF20BCCC0EEA3E2B45806606E99C2F919E6BF81D585A7E23296021A1F4C63206F7B191A8FC4A7EAB47CC14123B5C3ED8A0F7A95512C3DADAE897BE31E857B3F6B55FCA3581E4573826D99F5AAE09D9AAA96FBE8BA88568D9CE290859EB36A17F72DD88C76E7C'
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
