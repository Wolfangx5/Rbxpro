const express = require('express');
const fs = require('fs');
const app = express();
const wait = require('wait');
const socketService = require('./utils/socketService');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const uuidv4 = require('uuid').v4
const bodyParser = require('body-parser');
//-----------Server-----------------------//

;
const server = app.listen(80, () => {
  console.log(`Server is up`)
});
socketService.initSocket(server)

//-----------Ultis---------------//
const { connect,
 
    changeUserBalance,
    getUserData,
    checkUserExists,
    addnewUser,
 } = require('./utils/dbChange');
const { getRandomInt, generateRandomHash, round } = require('./utils/randomHash.js');
//-----------routeLink---------------//
const loginRoute = require('./routes/login.js')
const homeRoute = require('./routes/homepage.js')
const earnRoute = require('./routes/earn.js')
const walletRoute = require('./routes/wallet.js')
const userAPI = require('./api/userAPI.js');
const { send } = require('express/lib/response');
const { error } = require('console');


//-----------Else---------------//
app.use(cors());
app.use(express.json())
app.set('trust proxy', true);
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'views')));
app.use(cookieParser());
app.use(bodyParser.json());


//-----------Routes---------------//
app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname, './views/404page.html'));
})
app.use('/login', loginRoute)
app.use('/earn', earnRoute)
app.use('/home', homeRoute)
app.use('/withdraw', walletRoute)
app.use('/api', userAPI)
app.use('/', homeRoute)

connect()

//--------------Config------------------//


//----------IDK---------------//

                                                                                                                     

const clientId = '1122511630123663431';
const clientSecret = 'Qq9ce92VU9lbrlVXawfsDri6Ze0oQbxS';
const redirectUri = 'http://127.0.0.1:3000/callback';
const discordApiBaseUrl = 'https://discord.com/api';



app.get('/callback/bitlab', async (req, res) => {
  
  const { uid, val, usd, type, tx } = req.query;
  console.log(uid, val, usd, type, tx)
  if (type === 'COMPLETE'){
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance + parseFloat(val)*2
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }
  
  }else if (type === 'START_BONUS') {
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance + parseFloat(val)
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }

  }else if (type === 'RECONCILIATION'){
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance - Math.abs(parseFloat(val)*2);
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }
  }else if (type === 'SCREENOUT'){
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance + parseFloat(val)*2
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }
  }
  
});
app.get('/callback/cpx', async (req, res) => {
  
  const { uid, val, type } = req.query;
  console.log(uid, val, type)
  if (type === '1'){
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance + parseFloat(val)*2
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }
  
  
  }else if (type === '2'){
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance - Math.abs(parseFloat(val)*2);
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }
  
  }
  
});

app.get('/callback/kiwi', async (req, res) => {
  
  const { uid, val} = req.query;
  console.log(uid, val)
  
    const userData = await checkUserExists(uid)
  if (userData){
    console.log(userData)
    const newBal = userData.balance + parseFloat(val)
    console.log(newBal)
    await changeUserBalance(uid, newBal)
    res.status(200).send({
      status: 'success',
      message: 'API request successful',
      data: {
        msg: "Good"
      },
    });
  }else{
    console.log('User doesnt exist')
  }
  
  
  
  
  
  
});
//https:// https://da97-2402-800-63b8-9a6a-81cb-9488-a44f-df8c.ngrok-free.app/callback/cpalead?subid={subid}&payout={payout}&virtual_currency={virtual_currency}


  //



//--------------------------------------------------Bot------------------------------------------------//
