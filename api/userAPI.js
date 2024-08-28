const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_026F3F0F9549AD59F169ADA65A85A0EF8E2F61402661DC2B6A76BB08FEC8FBA5E0CE8858407CD0B2BBFEEF83A5C1C5300B93D65AB834E8AFC0538E4A78A31423FE2257BA9CE4DD5017AF57F614F8021B7CAE350AF1AF21DD6992DF1386085BF410E8009B9C4FB01D15A3EA47C147BC8BFDF03F075B27DC38247B3501A0EB9376539AB03CCC2F4534982E3DE20A6D71256F01D68808D72F19DC162AA3C6BEA1451F126EF04E322D56D1416672F70D0FB9DE7064675FCE138225679B2B70B339FF7D8719B97B311201E5BC717F2CF10C09B8A8415E13300C36F753BC31ACC41E528DBDCDCBFE4C3B9E320CD876ABB59A903EE33D6F6CE9340270BE6BF1945BEB785E33D34746D2DC223B9561BFD1C720AB9C6B1B9E19572ECB86CD51318CD444FFE9EC5A59A2DEED951EC73D01774FFC0C837C3052C79D45CE3FA290FC68639413A44814B3B24F908073959CFE6E116335D3DA0E27D58DD0AB1C962EAB23B33BE116D774F01B93F7F54422C47B66007CBA0B536D466E4397D9E68FE9E2FBF922D2ADCC9E4CD3851E790DB24523CA6ECE257E709171D7F04A7DF93AF8D821814666A90FC51D2DF3AAF6257B81925D16154623043A9EAB8C4DF7DEADD0AD98581C7E91F6DA845F77F4945E3DFE0E0B6C516652E5B299F6D98816E08947F0D7E7EF4CDD7F2FB41873BBF4634F4C7915494343C3FE6196965EAD004791751283210303155887ED8C1D3459D3E5A6DF75EE88FED1D7CD14BCA440C531568F732045F2908AA931409816C0771BDE616E77CCD7A81B916C860075AF370964C8E9220B495565CB23D2259DB4189A87AFA410F5567074F862C090625724D99F4B28565C4954C2538E3BE081296B8F096E02626DCE0362F824F6074D0A844602FAC55DBBFE3A8E50C58D4AFAFF180E6538C6BE73FEE6FBF93CEF')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_026F3F0F9549AD59F169ADA65A85A0EF8E2F61402661DC2B6A76BB08FEC8FBA5E0CE8858407CD0B2BBFEEF83A5C1C5300B93D65AB834E8AFC0538E4A78A31423FE2257BA9CE4DD5017AF57F614F8021B7CAE350AF1AF21DD6992DF1386085BF410E8009B9C4FB01D15A3EA47C147BC8BFDF03F075B27DC38247B3501A0EB9376539AB03CCC2F4534982E3DE20A6D71256F01D68808D72F19DC162AA3C6BEA1451F126EF04E322D56D1416672F70D0FB9DE7064675FCE138225679B2B70B339FF7D8719B97B311201E5BC717F2CF10C09B8A8415E13300C36F753BC31ACC41E528DBDCDCBFE4C3B9E320CD876ABB59A903EE33D6F6CE9340270BE6BF1945BEB785E33D34746D2DC223B9561BFD1C720AB9C6B1B9E19572ECB86CD51318CD444FFE9EC5A59A2DEED951EC73D01774FFC0C837C3052C79D45CE3FA290FC68639413A44814B3B24F908073959CFE6E116335D3DA0E27D58DD0AB1C962EAB23B33BE116D774F01B93F7F54422C47B66007CBA0B536D466E4397D9E68FE9E2FBF922D2ADCC9E4CD3851E790DB24523CA6ECE257E709171D7F04A7DF93AF8D821814666A90FC51D2DF3AAF6257B81925D16154623043A9EAB8C4DF7DEADD0AD98581C7E91F6DA845F77F4945E3DFE0E0B6C516652E5B299F6D98816E08947F0D7E7EF4CDD7F2FB41873BBF4634F4C7915494343C3FE6196965EAD004791751283210303155887ED8C1D3459D3E5A6DF75EE88FED1D7CD14BCA440C531568F732045F2908AA931409816C0771BDE616E77CCD7A81B916C860075AF370964C8E9220B495565CB23D2259DB4189A87AFA410F5567074F862C090625724D99F4B28565C4954C2538E3BE081296B8F096E02626DCE0362F824F6074D0A844602FAC55DBBFE3A8E50C58D4AFAFF180E6538C6BE73FEE6FBF93CEF'
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
