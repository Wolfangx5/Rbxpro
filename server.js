const express = require('express');
const fs = require('fs');
const app = express();
const wait = require('wait');
const socketService = require('./utils/socketService');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const path = require('path');
const axios = require('axios');
const uuidv4 = require('uuid').v4;
const bodyParser = require('body-parser');

//-----------Server-----------------------//

const port = process.env.PORT || 3000;

const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is up and running on port ${port}`);
});
socketService.initSocket(server);

//-----------Utils---------------//
const { connect, changeUserBalance, checkUserExists } = require('./utils/dbChange');
const { getRandomInt, generateRandomHash, round } = require('./utils/randomHash.js');

//-----------Route Links---------------//
const loginRoute = require('./routes/login.js');
const homeRoute = require('./routes/homepage.js');
const earnRoute = require('./routes/earn.js');
const walletRoute = require('./routes/wallet.js');
const userAPI = require('./api/userAPI.js');

//-----------Middleware---------------//
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'views')));
app.use(cookieParser());
app.use(bodyParser.json());

//-----------Routes---------------//
app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname, './views/404page.html'));
});
app.use('/login', loginRoute);
app.use('/earn', earnRoute);
app.use('/home', homeRoute);
app.use('/withdraw', walletRoute);
app.use('/api', userAPI);
app.use('/', homeRoute);

connect();

//--------------Config------------------//

const clientId = '1122511630123663431';
const clientSecret = 'Qq9ce92VU9lbrlVXawfsDri6Ze0oQbxS';
const redirectUri = 'http://127.0.0.1:3000/callback';
const discordApiBaseUrl = 'https://discord.com/api';

// Discord webhook URL
const discordWebhookUrl = 'https://discord.com/api/webhooks/1259268256351649822/3538y4__KKC6z_iwX3s-WFhd3R8N6zNp5CO00ubHvpdrCfo_rzC_MJWb7S8Qclb2UX9J';

// Function to send a message to the Discord webhook
const sendDiscordWebhook = async (username, amount) => {
  try {
    await axios.post(discordWebhookUrl, {
      content: `${username} Just earned ${amount} R$! 💸`
    });
    console.log('Discord webhook message sent successfully');
  } catch (error) {
    console.error('Error sending Discord webhook message:', error);
  }
};

//-----------Callback Routes---------------//

app.get('/callback/bitlab', async (req, res) => {
  const { uid, val, usd, type, tx } = req.query;
  console.log(uid, val, usd, type, tx);

  // Handle different types of callbacks
  if (type === 'COMPLETE' || type === 'START_BONUS' || type === 'RECONCILIATION' || type === 'SCREENOUT') {
    try {
      const userData = await checkUserExists(uid);
      if (userData) {
        let newBal;
        if (type === 'RECONCILIATION') {
          newBal = userData.balance - Math.abs(parseFloat(val) * 2);
        } else {
          newBal = userData.balance + parseFloat(val) * 2;
        }
        await changeUserBalance(uid, newBal);

        // Send Discord webhook message
        await sendDiscordWebhook(userData.username, parseFloat(val) * 2);

        res.status(200).json({
          status: 'success',
          message: 'API request successful',
          data: {
            msg: 'Good'
          },
        });
      } else {
        console.log('User does not exist');
        res.status(404).json({
          status: 'error',
          message: 'User does not exist'
        });
      }
    } catch (error) {
      console.error('Error processing callback:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  } else {
    res.status(400).json({
      status: 'error',
      message: 'Invalid callback type'
    });
  }
});

app.get('/callback/cpx', async (req, res) => {
  const { uid, val, type } = req.query;
  console.log(uid, val, type);

  // Handle different types of callbacks
  if (type === '1' || type === '2') {
    try {
      const userData = await checkUserExists(uid);
      if (userData) {
        const newBal = type === '1' ? userData.balance + parseFloat(val) * 2 : userData.balance - Math.abs(parseFloat(val) * 2);
        await changeUserBalance(uid, newBal);

        // Send Discord webhook message
        await sendDiscordWebhook(userData.username, parseFloat(val) * 2);

        res.status(200).json({
          status: 'success',
          message: 'API request successful',
          data: {
            msg: 'Good'
          },
        });
      } else {
        console.log('User does not exist');
        res.status(404).json({
          status: 'error',
          message: 'User does not exist'
        });
      }
    } catch (error) {
      console.error('Error processing callback:', error);
      res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  } else {
    res.status(400).json({
      status: 'error',
      message: 'Invalid callback type'
    });
  }
});

app.get('/callback/kiwi', async (req, res) => {
  const { uid, val } = req.query;
  console.log(uid, val);

  try {
    const userData = await checkUserExists(uid);
    if (userData) {
      const newBal = userData.balance + parseFloat(val);
      await changeUserBalance(uid, newBal);

      // Send Discord webhook message
      await sendDiscordWebhook(userData.username, parseFloat(val));

      res.status(200).json({
        status: 'success',
        message: 'API request successful',
        data: {
          msg: 'Good'
        },
      });
    } else {
      console.log('User does not exist');
      res.status(404).json({
        status: 'error',
        message: 'User does not exist'
      });
    }
  } catch (error) {
    console.error('Error processing callback:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// Add other callback routes here if needed
