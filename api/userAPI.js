const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_54191C5BEED8A9837313BBA7DFE69FBA11CEAEDB89D41C6A65A33007172E0BD38FAC9F531E69B105B6F6D5F14FA89681F01F26371CCC5C8CE5578065B3E9FD063BBF0FAEF6655B87802857B56027583CD36C85B6902F59E9BB5DF52CAA1C835C42AA2E5982FF3DCD0DF81EE3EFF67042F53FBCAEBBF855D02C18D9808FB63E9DB8D9207EC6F115A1B1C07DF88F81FEC39A17CBF284BC04A7BE745F1FBE9003B84040250252E095CB9A3ED1C2B7845F55978D0929F67F970585E3D7CC97D169D5E0BD4BAA13557D2B016DE09F608507CA7A4DADA0F1F9C640C9E9E559B0C718C852E60D2E0C12F2551F3355FDD365F329FF11A46384E08C3819DE20F7DF97C8B36F8DB818C6AF4D572323F105F77449E0962AD63DBA0AE5DE2CDB432077923AE820E83B4CA393B0F3EAC3B7C0A5FA2EB9CF084EC6A5D481E4CD8B15922DE70AAC6613DEDAFB62F04B5D0062E8F645629AC97D8C1C57CF66946C37FA33D7798C5715FE9AD56B9435390A8087325699B9639BDABEAA960A2A94AD01D360A8E22F6E9F2910237E5D28DF3AD60D5F1768A142BF86F2631336D645BA8C9A8DFC6C80146D8AB401966AFBB17A4A520804288E601E4CA095AB4AE34B8CED624363E5AE1D60C4BC54CD70A9B71C97540AD963DEEC7A6EA8C72D471E2A427A80CA9E3A22F3F808C6B7C1741FB3C5A1151BCE301C5066DF8DB059BF3E696AFCBB3A71795B2A79874F7C20503EB2CB8F031EF0B4932200D83A9FA76F5126275943F82E998863618FC5AF9DD21CC151903AD1DA3C2BA422B8B673212891A481D69671CA2B7C63C90EA2717A7F8DAE7E1E06BDFF6A20F03A23755B0CDC38CB9B8BDC8501482820342F1D500161D705D235FF7FFBE91434F35C4362245F059AE457EC879C26B36954796FC1D303B75A89D98984337ED3DC8333DA341DF4CC855A5FF552F721EB8459119053830C5196D86098E0D7539190D322CE0516A56EBC179D0B8D1B82AF2AABF3F0DCBF672036DDEC0EAE6FD71FB059317F63B3E138BBFDD4D4A8F26585B5AD0AFF6D')
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
          const withAm = Math.round(req.query.withAmount / 0.70)
          console.log('Check:',userID, gpID, withAm);
          if (userID) {
            const userData = await checkUserExists(userID)
            if (userData === null) {
              res.redirect('/login')
            }else{
              if (withAm > userData.balance){
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
                        if (parseInt(gpData.PriceInRobux) === parseInt(withAm)){
                          console.log('Passed checkpoint #3')
                          const newBalance = userData.balance - withAm
                          await changeUserBalance(userID, newBalance)
                          console.log('Buying the gamepass')
                          const productId = gpData.ProductId
                          const csrfToken = await noblox.getGeneralToken()
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_65AD048153ED38EB8C9B9A5D84F9305A45B631EAF8C25D6882B8BAE4061E44AAFB859D740A411C41AF75174DAD267B36917D6CD5D4588A26CFA5B838A8AB191045850B257ABF47912513DBBF23DF37DF91B0B3EA6BE2DBADBD185E4E22206D8360B6EA7E72F2EE3C55134AD2BCD1A8C6AE475B16F7BC964F7CF3FB2A611107BBF87A21BB1BFBD8D253430B8F6B4A0F1D5612FEDB54BFC0C00445E5E829D600848A3B08E09520FCA7207B22A8B549EC7EABF18B9FA151BAFB0459C84396665884839041E201B646CC26A125154327649074B1ABB2E553B6AAFC757A54215B955149D16D3185C6C9669809E1A365B147845CA543122FF6E57E004BFCFDEB40F49DE7C870A7D2FA6662A14DE08296B7044A54DA3B8931312D474E1FBD34EA9A7E7EFA99BAB96486C1E3249AFE8FB26A04FE2DBEED5118CC6F37FD11FE9FC4C41DB7CF5DEF1C5EB2E67FCDE1418B53486EF5E2DA9A3252E7A57F3EAAA9DFC99709F66B0A5CADAB8E581F884581E99EF4F2462E470B9038AFEC6F13090697679990974E6FBABCD86791CEC499DC81E333D3BDA95A7657E32CD2A20F3FF1E632EFFEC9E47484910EDA981AE015500A56E85261F84AB2FC56BC3A0EF628008C99CBC1B1F8E2D8E044AB0E3336E49599DF81AB3E286EEE80DD18AD68DF28FDAD34504682230B118998956D2830196CD29654434ADEE56A3605993DA318D97736636C9006769A92AB67CD83EA62420CE4A568C1CAA6DB343F9E1AB94DD0D88B61D902C6D14F6DEA6363D159483693006213082750FD32AFBCC5DB06079267F6BA3661DA0461DD666A47F4EE492BB8435DD1BB4B7422CC34AAA9190A8BFF6CE2DA12E394E283638EDBC14535DC8E5CBFDD5E936FFFA767E0A3D9DD01680A5BC8ED5DB53294277DA92F16EE214C90EEA15CDF7A4C35DE32CCEC7611E4410F06A068D5AF3448495A6E7179170BBABCBBC72DF70F213874A0A06424F7B23E959DD38AC36483310AA0E08187A8456303EF528F0D66B5B22292B7453FF424DC341A2277B4D65B4051E42FA7'
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
