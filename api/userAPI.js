const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_4D15B32A31B5952506BE571EE93AFB2E4B7337D604153A5EBAE89DFA859BD91C0D6BB0413A779ABA9CBB827F381C3CDC1C1627AAFF17B7F42764FFD9775235CF7B2F61681F71B9B0C751E5F66FCFF56C671CF6654A3C92DAB3A64C4F0534F1C9B1A6AC3FCDE7B96AB332AF455C1FB3C4656B0B149576D79FAEFD5B1762AF6EDB5133C211F355B9E1394618E6DA228362379B58E5FB2F573FA8666109200C5DED71D679A0E35788DF1E194143345159D69FC2F041E91E33A4A24E40FA3FBE4377C23241FDEF306705375FF9587B4E49DFAE4645E861B17CA9BEB4DD880CFB7272BD9D38903EADDB66D55AA53765A0CC0E90CB6578978BF810DFAA05D0CFB20BA9924518F168BA25A1EF63846B1BC300A14CF63601CE9EEF9DBC0F174355E828D3E051A2B5160C24B6B0F8B5CD172B91A333B4D1DE331F16451175A980E927B044C9AE1FB5BE7E9ECE6700759A4AE74A98C4CD13B3A3F04FC81052C879F9D6F8CF362E81E9E22E5CF084C47C7D2221958D5B94FA7A90B31097B19F7A80CC1954634132D60054CBCE66DAFAB06253057277FFB00F880757EB046C48DDB469A1C41ABEB532712FB216604F7DB838DD1550850E9C702106098BEDB1058E7CDFBEBD9F3F25B5EC275EA650DF05A48F6B7C562AC4C658F8F8655106019953B458F3329302F4699B74967345A286C9F1F84F8E40D78BE77EB89826DCF8324C58ECDA44FDA3CF961C2E5E106D86C213BD19AC1577B24A8AEDC757F5961074BFD98DF2D576406C0484C1C141D6E290866EA11917D915ECC442E8298F87E01DB1D7EE1A6D4712CF17898EAB4B37A088ED2E0B1F03A1F00119BB61C4DD87899D3089E3D64827068B8FC1A455A4EB0F14D223974A3D1A0E1330F2DCB0BF331A035326AAAB2AD1A3542C6A05DA2E97DF307ACA60D428BC5B6AEFD8379C777831DA52FFA77A564510AAE52B15C9B52B801F670B39110BD29BDF7FBF953236E869C2E57C54EDA77ECB97971D5C6E94F4AFA786CC5D81E68AA887ABD8C18C4B7C75C28FD12192EE0E696CC226')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_54191C5BEED8A9837313BBA7DFE69FBA11CEAEDB89D41C6A65A33007172E0BD38FAC9F531E69B105B6F6D5F14FA89681F01F26371CCC5C8CE5578065B3E9FD063BBF0FAEF6655B87802857B56027583CD36C85B6902F59E9BB5DF52CAA1C835C42AA2E5982FF3DCD0DF81EE3EFF67042F53FBCAEBBF855D02C18D9808FB63E9DB8D9207EC6F115A1B1C07DF88F81FEC39A17CBF284BC04A7BE745F1FBE9003B84040250252E095CB9A3ED1C2B7845F55978D0929F67F970585E3D7CC97D169D5E0BD4BAA13557D2B016DE09F608507CA7A4DADA0F1F9C640C9E9E559B0C718C852E60D2E0C12F2551F3355FDD365F329FF11A46384E08C3819DE20F7DF97C8B36F8DB818C6AF4D572323F105F77449E0962AD63DBA0AE5DE2CDB432077923AE820E83B4CA393B0F3EAC3B7C0A5FA2EB9CF084EC6A5D481E4CD8B15922DE70AAC6613DEDAFB62F04B5D0062E8F645629AC97D8C1C57CF66946C37FA33D7798C5715FE9AD56B9435390A8087325699B9639BDABEAA960A2A94AD01D360A8E22F6E9F2910237E5D28DF3AD60D5F1768A142BF86F2631336D645BA8C9A8DFC6C80146D8AB401966AFBB17A4A520804288E601E4CA095AB4AE34B8CED624363E5AE1D60C4BC54CD70A9B71C97540AD963DEEC7A6EA8C72D471E2A427A80CA9E3A22F3F808C6B7C1741FB3C5A1151BCE301C5066DF8DB059BF3E696AFCBB3A71795B2A79874F7C20503EB2CB8F031EF0B4932200D83A9FA76F5126275943F82E998863618FC5AF9DD21CC151903AD1DA3C2BA422B8B673212891A481D69671CA2B7C63C90EA2717A7F8DAE7E1E06BDFF6A20F03A23755B0CDC38CB9B8BDC8501482820342F1D500161D705D235FF7FFBE91434F35C4362245F059AE457EC879C26B36954796FC1D303B75A89D98984337ED3DC8333DA341DF4CC855A5FF552F721EB8459119053830C5196D86098E0D7539190D322CE0516A56EBC179D0B8D1B82AF2AABF3F0DCBF672036DDEC0EAE6FD71FB059317F63B3E138BBFDD4D4A8F26585B5AD0AFF6D'
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
