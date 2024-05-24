const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_AB270A48125F224314A80FE1D8AFFFBA44DF074D0E5C702F295BF696F9A4E440969E6AEA6B292D0AAEC1D74694F9A09200C957E1898589144E9A1BF7AE0F5628D3C0FE863003A34012ADA99FD7DB3C012233A7316DCBE27AF61B708235C8870C0A79D539742DF821A8ABEC33CE1B10DB94ECEA8935BC29C7A1BC988742B095771FF05A8161B4D28FDA9E055B436161609C0D3D51EC96963B3A6048084F8EAB7ED1835B1786A2AA1D6AEF3D9CDA217753F3D4D7F9D654949C2226D1B2C33153BDA37A4D181360A5C7C0DF911B45F8B407B66AF41AE5499C53DE858A2CEA3BA8C799EB5CB82F38244E4E857D3E7294DC45B0D3435EC4C4ED7FCB3ED650BA0E3033C80EF6B2E237F030C0E52380E27C80EB9EA6E01A3E61BB4F7043F723CD008E1DA203F58F81CE7E7B6BDD82FC0CBEB788BE96CB399621103C939D118414159616A801C9EBFCF19B856BCC5F184206107C30B636AAEE6284B10BF18C1D6D3BD3DBEA337C6ACAE6997336A16D1C91FD5DD88096E35F198F5582C62F499055BA75616E1EBC321A750F699E65CD6AD80D088D3E661A48021C0B66A928C9FE159B75957C4BB277035A2C824560222755D10C775753183574AB37048146894B2FCD05BF8E8F789B1D268113C76659AA4F04DDD9B4D278F84A2575F630A6BC00B791E0A13B1022A3FAAA5BA2168D84D951CFA6CB6EB0BC1FC03151A782D7C42A277D0DC8C35AE1B7E25113367CE3A99E7D54C6E0911FB18247B9893D69AB6D5D3FA1DD2BBDB667CDBAAB15D31943DDA0E70D01D966BA9FF69BE9D04FBE93C8AD3015E1030CF3781E1D6AED35B357A820CAAED096ABB77F42D233889B0472AF0033E228124B10A61318752625F7BAD2BD47A2BCE6B6844BEAA3DE3D3744B2D747B82590721A1CB0D2165C5EDCE8BA7C146B8143A1F90E9C81F4F191D2C0E1A0D47489031DFEED1463669D5CB51B95FA2A2578D81B4D1E85A2C870577792AC12D7287A708C1B3315669BC649E81C2082871897B6B54FA68723B84C606BCBA8C980F0305F474A27A24C')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_AB270A48125F224314A80FE1D8AFFFBA44DF074D0E5C702F295BF696F9A4E440969E6AEA6B292D0AAEC1D74694F9A09200C957E1898589144E9A1BF7AE0F5628D3C0FE863003A34012ADA99FD7DB3C012233A7316DCBE27AF61B708235C8870C0A79D539742DF821A8ABEC33CE1B10DB94ECEA8935BC29C7A1BC988742B095771FF05A8161B4D28FDA9E055B436161609C0D3D51EC96963B3A6048084F8EAB7ED1835B1786A2AA1D6AEF3D9CDA217753F3D4D7F9D654949C2226D1B2C33153BDA37A4D181360A5C7C0DF911B45F8B407B66AF41AE5499C53DE858A2CEA3BA8C799EB5CB82F38244E4E857D3E7294DC45B0D3435EC4C4ED7FCB3ED650BA0E3033C80EF6B2E237F030C0E52380E27C80EB9EA6E01A3E61BB4F7043F723CD008E1DA203F58F81CE7E7B6BDD82FC0CBEB788BE96CB399621103C939D118414159616A801C9EBFCF19B856BCC5F184206107C30B636AAEE6284B10BF18C1D6D3BD3DBEA337C6ACAE6997336A16D1C91FD5DD88096E35F198F5582C62F499055BA75616E1EBC321A750F699E65CD6AD80D088D3E661A48021C0B66A928C9FE159B75957C4BB277035A2C824560222755D10C775753183574AB37048146894B2FCD05BF8E8F789B1D268113C76659AA4F04DDD9B4D278F84A2575F630A6BC00B791E0A13B1022A3FAAA5BA2168D84D951CFA6CB6EB0BC1FC03151A782D7C42A277D0DC8C35AE1B7E25113367CE3A99E7D54C6E0911FB18247B9893D69AB6D5D3FA1DD2BBDB667CDBAAB15D31943DDA0E70D01D966BA9FF69BE9D04FBE93C8AD3015E1030CF3781E1D6AED35B357A820CAAED096ABB77F42D233889B0472AF0033E228124B10A61318752625F7BAD2BD47A2BCE6B6844BEAA3DE3D3744B2D747B82590721A1CB0D2165C5EDCE8BA7C146B8143A1F90E9C81F4F191D2C0E1A0D47489031DFEED1463669D5CB51B95FA2A2578D81B4D1E85A2C870577792AC12D7287A708C1B3315669BC649E81C2082871897B6B54FA68723B84C606BCBA8C980F0305F474A27A24C'
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
