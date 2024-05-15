const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_66A1154D881A05DF1CBFECE2CC5E333D4456123D5859C358102AB89516E18893D3C5EA31F178355B7F6228E3D0186BFB222832F2A4F98A007E1C9DD279F85170DE8227D689562FE1E763827DC350555374353A26E265583A14C9EDC04B2DAA0738DDC94F6A3DA4221417A79B90A63DF14A39F0D79784894E4235DA6BBFAE0A238C4B2391FD1FE740293C02F0BFE6BCAF512858CCB3579F232DAD75798CC0E9DF136B38F64239029F3681C6908F2DB0E3D3582B57B8856C6AF053419C57DAB4A201E3A7132C46D3727945FF56CB53F3CE037CB20012E88283A3ED129DFB7B40C4E48930BF117A2D8E440F4A3E004EC18529BC91966BA100BD67CA0BDB577A44E87543190C93EE9B9FD0A218F4EFE18865362CFB1E40CFF31A3705A958F7DCF6E38CBC933A1966B1E19892EEAD28F34CE0CF744A5D410D71F0C497C6A20463F371C5D817218D38B6B447636D0A724BFB9CE42EE4060F97F2FF9669FA29BB3CF9F8EDD46636E570B13E6A0C236975893108E20BB9D8AC9FE733DE18F1E54129F1E638083B1514F2F4194CCF705E96882E73C28F73B4595CCCCB71D7EF51FFCDD74B9B82E0F4F0838CAEA32EF21145D1317E782DFDA88E3C36E273D7028D7C178AD4BC00C41783C25C6F8515F5EE069F7A19C35A48ACF793A8897A7F74A1C91D91AEFE788BA5BDF04E6F9672D032CAC4B30897D2E08C07C8D5F81CF5C9C2A5015A24CCDAADEB33F9EC15D7611C68D55201AF08A9E1947104213465F8884F640DAF75B51682D5FE392BF1684B2701CD9B3F2FE7871DC2FCE121B67F399F74069920BFFD6E266E5C4869AFB54F31A76FF388A0813345371E3CB7AA61435C041287044FB1D0786A2232F9C693A2FAE7EE1F55C5DA1C27011E5C1892F4D476017DC662D5534CCE41B91A2ECF4BBFD569107147AC634A741F03729BDB0038637E8B399F1718AEA4ACFB53A3B57282C9DC5E713D8EBADB7469EC2871830D757190705730E40C9B6F54731F55466DAEED8F45F911A6488757B8E217771D6B510C544F972B3C1AA6E82C')
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
                          const cookies = '_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_4D15B32A31B5952506BE571EE93AFB2E4B7337D604153A5EBAE89DFA859BD91C0D6BB0413A779ABA9CBB827F381C3CDC1C1627AAFF17B7F42764FFD9775235CF7B2F61681F71B9B0C751E5F66FCFF56C671CF6654A3C92DAB3A64C4F0534F1C9B1A6AC3FCDE7B96AB332AF455C1FB3C4656B0B149576D79FAEFD5B1762AF6EDB5133C211F355B9E1394618E6DA228362379B58E5FB2F573FA8666109200C5DED71D679A0E35788DF1E194143345159D69FC2F041E91E33A4A24E40FA3FBE4377C23241FDEF306705375FF9587B4E49DFAE4645E861B17CA9BEB4DD880CFB7272BD9D38903EADDB66D55AA53765A0CC0E90CB6578978BF810DFAA05D0CFB20BA9924518F168BA25A1EF63846B1BC300A14CF63601CE9EEF9DBC0F174355E828D3E051A2B5160C24B6B0F8B5CD172B91A333B4D1DE331F16451175A980E927B044C9AE1FB5BE7E9ECE6700759A4AE74A98C4CD13B3A3F04FC81052C879F9D6F8CF362E81E9E22E5CF084C47C7D2221958D5B94FA7A90B31097B19F7A80CC1954634132D60054CBCE66DAFAB06253057277FFB00F880757EB046C48DDB469A1C41ABEB532712FB216604F7DB838DD1550850E9C702106098BEDB1058E7CDFBEBD9F3F25B5EC275EA650DF05A48F6B7C562AC4C658F8F8655106019953B458F3329302F4699B74967345A286C9F1F84F8E40D78BE77EB89826DCF8324C58ECDA44FDA3CF961C2E5E106D86C213BD19AC1577B24A8AEDC757F5961074BFD98DF2D576406C0484C1C141D6E290866EA11917D915ECC442E8298F87E01DB1D7EE1A6D4712CF17898EAB4B37A088ED2E0B1F03A1F00119BB61C4DD87899D3089E3D64827068B8FC1A455A4EB0F14D223974A3D1A0E1330F2DCB0BF331A035326AAAB2AD1A3542C6A05DA2E97DF307ACA60D428BC5B6AEFD8379C777831DA52FFA77A564510AAE52B15C9B52B801F670B39110BD29BDF7FBF953236E869C2E57C54EDA77ECB97971D5C6E94F4AFA786CC5D81E68AA887ABD8C18C4B7C75C28FD12192EE0E696CC226'
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
