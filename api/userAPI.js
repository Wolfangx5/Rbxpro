const express = require('express');
const router = express.Router()
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const noblox = require('noblox.js')
noblox.setCookie('_|WARNING:-DO-NOT-SHARE-THIS.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items.|_AE535C4FF75A58381AE73FCDD287539EBFC00F22BEAF436A3C199129D5214DE78374201BB4E2E1DF17D9135BBB505BACE498F897BF00D270887F12DF8E4941C992CEDEAACDE8B44D692577941C800D8C717BBD30862BBB5C459E55FE9421FBB8AF773A181EA36CFEBDC0902C7E8D4AEE983F1622CF911CC05BC419F39B1297EA01DEBD5EDF93C942BF5944ED85996C80EBDE8B8974A0B1483616B30F57F569DA7EB6C787D53EE92F00FC7CBDAFBB7F3ED2D4915735DD9DFE0C660CCDCA16E86DF218F1DF1D0981DF10FCD2673BEF67FEF65ADD7F18E1978B1FB7E53F88D47576C6984E34B68AEC96A044AE1EBB9D3C08F5002E0443E4C9BDEA6AFFB2FA00ACAE20CE6463876776FB1309C56E80A17AC8EB67E83835B6B9E353A6E62F2B48E43ED61660EBC26D13674239B884FC2CDFBCBE4DD4747631F04C4A9B3463A2F99996ED1462DBBBA701F9E6C05F2F8499D6E8EBF827DE223AB601EF5FAECF21F65345D07301FFF88F108C70277AF3006C412E4C5288C25780A1C3828E67B0940BD38BC34563E155833C3F7A9444C03D7DEB46CC96BCCA849008EBA2574B318169F3244C99A81501CE1ACC96B495011C4EC245AC588A5FA93E4C0363991070E6DF754E8AF1D6A4EB0CBD24926ABA3A9ED837B59E4FC4DFB8B0A82F25FBD7297B780CF21177344807ADF3B9BC757FE4029956440596A8301A82EC3216BB7892D1C229ECC7E18D8ACE7FE7840F6EBA2F73BFCFA5CD0A03CBCEF77AA9628C108ADF31575C3079F49C6218485D9B90E7394C951D61AC15179D0E37EDBCDE96C4DA101A1A5CB25393F3702F7131EC5B3B605414F01D62C82A895931C85CD673C4C96F78B9320ACBCB6EF697B3C501540FB392D393C49806AD329D6E5FAC3CB0A427411BCFB8A8D796009EB10E342000EBF448FE9D78EEC62CB9279448F9666E0E7F7442831C8880FC0CB14C1B73D7DE77950C896D5B61FA914432E959FE813E1F374D1E82ED97D3F54CD57B9FE7752EA9CDFAD07FDD2562DDD93785C499650B8A0066AB476FFD960B31')
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
