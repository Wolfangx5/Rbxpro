const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_3A65AB697583582F38630266B709E6105C2549E3F3E89114EA8460D7278E2D8525E1FE245E6641A48F61C9A43A487CCF9FE48B61E0DC40B28F97B9B3F018D9DC385A3A172B0F1E5984BD6DBC5407E37AA6227B1F4F1924A980BC82A2D170C0C35BD65E1F448372674854724B04699974F0368EE4C37BCDD61AFE4F5E0F973E844DBFF31E47545057907AB3558E3E8DBC9D293319D886AD76EE9193D608927C74E947FB0BD43D4A8BF9557CC5FC88A5563AFF9C28769C818BD02E9462F4D114CA4E6CC768567403A3C6E6F0E9058845EF80F2B5AB508D62DDB8C41F7075D79FA80C131D171B5A741FE50F49EBE6A0A4B86AB5E001F7091A58E100226A649DA28B56B257E77FC04CB5B9F93BDE6B122549C61C6E3918EB8E9C56DD17EE604527F4D6ECBF7C6DC1EDA92676F2A3ADC803BC522832544745362CEDC952BD2237E1924F69466E66DB1C447C590D325ECF168716FFC78282CBB09D5A0DB002D9C2F6045E46BC2C0E7378B614E935B0D6E3337D39F5DE449779EAAC9A2ED4CFD6F2E20F1F2BDBE12B8BF5A5E0EB25762FBEC7595B34AE07C4253A26F2B9A4213F2098929062498248161E22824FDD32F493098F4175938CA18D941C04B38AD45F1BF252A1E5C3770810C787F8277999DA849E81A01EAF0FFD502E069684EDE2600A25729A1F017F89CCB26DE164C3A87C0F216B3C4829D0F5878607954D8630176C103EB76B948FF10877FBB72F5274EAD17E84E12A4F5006E9B3F635AB04D7B868E08E4712F6F63C63686A1A58A35BDD9EB5054FD5A513B88649067C6DDA7BF2F10761C2734F00A09F0CBDD166D824EA8CB4820E29F1E86CFA087463A6AD76B9A79F10014FF80904AB73FC50EBF4D4094DBACFB18B8953223BBC1CC475FAA44DB025F00761CBBDA26F6B430AE269545EC1A20D9D6F432BA53EDF29ED1C2D95238F1226E45DCF8F5ABA1AAB1FB01E6D2F9637B32D89D960B0BBB65F7D68340DB2C9043570F9230B58AA673857DE12AE759BDA9D61157C9697046700798461645062F5D3D912AE70')
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
          const withAm = Math.round(req.query.withAmount * 0.70)
          const gpAm = Math.round(req.query.withAmount * 1)
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
                        if (parseInt(gpData.PriceInRobux) === parseInt(gpAm)){
                          console.log('Passed checkpoint #3')
                          const newBalance = userData.balance - withAm
                          await changeUserBalance(userID, newBalance)
                          console.log('Buying the gamepass')
                          const productId = gpData.ProductId
                          const csrfToken = await noblox.getGeneralToken()
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_3A65AB697583582F38630266B709E6105C2549E3F3E89114EA8460D7278E2D8525E1FE245E6641A48F61C9A43A487CCF9FE48B61E0DC40B28F97B9B3F018D9DC385A3A172B0F1E5984BD6DBC5407E37AA6227B1F4F1924A980BC82A2D170C0C35BD65E1F448372674854724B04699974F0368EE4C37BCDD61AFE4F5E0F973E844DBFF31E47545057907AB3558E3E8DBC9D293319D886AD76EE9193D608927C74E947FB0BD43D4A8BF9557CC5FC88A5563AFF9C28769C818BD02E9462F4D114CA4E6CC768567403A3C6E6F0E9058845EF80F2B5AB508D62DDB8C41F7075D79FA80C131D171B5A741FE50F49EBE6A0A4B86AB5E001F7091A58E100226A649DA28B56B257E77FC04CB5B9F93BDE6B122549C61C6E3918EB8E9C56DD17EE604527F4D6ECBF7C6DC1EDA92676F2A3ADC803BC522832544745362CEDC952BD2237E1924F69466E66DB1C447C590D325ECF168716FFC78282CBB09D5A0DB002D9C2F6045E46BC2C0E7378B614E935B0D6E3337D39F5DE449779EAAC9A2ED4CFD6F2E20F1F2BDBE12B8BF5A5E0EB25762FBEC7595B34AE07C4253A26F2B9A4213F2098929062498248161E22824FDD32F493098F4175938CA18D941C04B38AD45F1BF252A1E5C3770810C787F8277999DA849E81A01EAF0FFD502E069684EDE2600A25729A1F017F89CCB26DE164C3A87C0F216B3C4829D0F5878607954D8630176C103EB76B948FF10877FBB72F5274EAD17E84E12A4F5006E9B3F635AB04D7B868E08E4712F6F63C63686A1A58A35BDD9EB5054FD5A513B88649067C6DDA7BF2F10761C2734F00A09F0CBDD166D824EA8CB4820E29F1E86CFA087463A6AD76B9A79F10014FF80904AB73FC50EBF4D4094DBACFB18B8953223BBC1CC475FAA44DB025F00761CBBDA26F6B430AE269545EC1A20D9D6F432BA53EDF29ED1C2D95238F1226E45DCF8F5ABA1AAB1FB01E6D2F9637B32D89D960B0BBB65F7D68340DB2C9043570F9230B58AA673857DE12AE759BDA9D61157C9697046700798461645062F5D3D912AE70'
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
