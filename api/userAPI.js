const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A718159040B72ABE8739419949E3AD56C04DFC7497DA6C624E8A693A4142C1E273BBB9651F5948FB8170D36477DBF8B5C7BB77F414CB3D8DA7E3A1401CC7FD16E435C65731294AC8096FAE55CC717F4AD85CCAC9FD0EF760A68D158D1F329ADEB495EAB2C70A09806721098937866889705FBC560EDC995EAF468FABC401CD380DD88C82C498E03DDAE6B48955175C86125F3021E5558A63F718655E28D4A8746A5B3F25F89246D78661392C00D41CB237C78D430EAAADAC8EA86CCE2DD96C1EEA947D7D83E77984F9D845B8DF7AB4FA16C14F48ADD6A1C86120A4973FF3E3493F422D28B20E25A6ECFDF8E867859B59C3B1D3D9FFC5834575EA31B1848A7906663898BDF729312747A9A86DE8641FA9DD7A09BB278D0312F849592CF8364C592CDE1E359986951B36EEB994473DCC42C8D618113FE3908CEC48C4B22B7E653DCFF4EAA363C8E2C39F6027A8DA52F95E9A71E91CB0CC446118EAC510C5B7A7C208055E2AB3014AC7584320B21E37F4B77DE178640A41A129E1DA6A6E457EE25867CBEA10A75D88D926D42014B73C810B16748FE81DDE0A08A689AE25E8E1F3EA4E001C8B6C22D2583CF0353E1E77F1C7A6DE4D38A55FCD1525D271E4B4EE97D20E2FF0F102BBBCBA8877EA382AFD4F83BD2FEC9FA7876EDD8E509E3CDE9B53955F845153B07B249F221FAB745EF54DC519B2BE29F2BB6AFBDCC1BE3E15B1F412A5308D265C283B509C3054F12E7510F462D979B383C85D2CEC87FD2F847F981D5FD50DB40B7151AAAE321BA7FCA1B678C6F8137CE9B40AB81C20D9D50320DC82B41F6E6CC67B154C6B8F8F8A46239D105C9BD48A78B80C01DE9CCDDBE5DA5200680CBA47182584D907EA01C5718B73366FDB490A1AE66AB7EFFDC8516CCA6ECF58B5558DE5F17096EEF79E71FCB36C7F2B51F24A1845823F410ABD98CB23D108D6AC6CEDEAF941061797AB40DD55AA5DFD72C174AD5A948896AF3884219C104FF2B9CE571C15B446C43968F249AA01B41BDB8F244C588B208C93898E493FE19BA8C8D4343EE99DA1B55DA66E91B90AE30E03FA8C0D8E453304DC209777AB6D01398AC559498D7E5E6F882D2257F68BDA3CC76B6C')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_A718159040B72ABE8739419949E3AD56C04DFC7497DA6C624E8A693A4142C1E273BBB9651F5948FB8170D36477DBF8B5C7BB77F414CB3D8DA7E3A1401CC7FD16E435C65731294AC8096FAE55CC717F4AD85CCAC9FD0EF760A68D158D1F329ADEB495EAB2C70A09806721098937866889705FBC560EDC995EAF468FABC401CD380DD88C82C498E03DDAE6B48955175C86125F3021E5558A63F718655E28D4A8746A5B3F25F89246D78661392C00D41CB237C78D430EAAADAC8EA86CCE2DD96C1EEA947D7D83E77984F9D845B8DF7AB4FA16C14F48ADD6A1C86120A4973FF3E3493F422D28B20E25A6ECFDF8E867859B59C3B1D3D9FFC5834575EA31B1848A7906663898BDF729312747A9A86DE8641FA9DD7A09BB278D0312F849592CF8364C592CDE1E359986951B36EEB994473DCC42C8D618113FE3908CEC48C4B22B7E653DCFF4EAA363C8E2C39F6027A8DA52F95E9A71E91CB0CC446118EAC510C5B7A7C208055E2AB3014AC7584320B21E37F4B77DE178640A41A129E1DA6A6E457EE25867CBEA10A75D88D926D42014B73C810B16748FE81DDE0A08A689AE25E8E1F3EA4E001C8B6C22D2583CF0353E1E77F1C7A6DE4D38A55FCD1525D271E4B4EE97D20E2FF0F102BBBCBA8877EA382AFD4F83BD2FEC9FA7876EDD8E509E3CDE9B53955F845153B07B249F221FAB745EF54DC519B2BE29F2BB6AFBDCC1BE3E15B1F412A5308D265C283B509C3054F12E7510F462D979B383C85D2CEC87FD2F847F981D5FD50DB40B7151AAAE321BA7FCA1B678C6F8137CE9B40AB81C20D9D50320DC82B41F6E6CC67B154C6B8F8F8A46239D105C9BD48A78B80C01DE9CCDDBE5DA5200680CBA47182584D907EA01C5718B73366FDB490A1AE66AB7EFFDC8516CCA6ECF58B5558DE5F17096EEF79E71FCB36C7F2B51F24A1845823F410ABD98CB23D108D6AC6CEDEAF941061797AB40DD55AA5DFD72C174AD5A948896AF3884219C104FF2B9CE571C15B446C43968F249AA01B41BDB8F244C588B208C93898E493FE19BA8C8D4343EE99DA1B55DA66E91B90AE30E03FA8C0D8E453304DC209777AB6D01398AC559498D7E5E6F882D2257F68BDA3CC76B6C'
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
