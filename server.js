// -----------Imports--------------------- //
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

// -----------Server---------------------- //
const port = process.env.PORT || 3000;
const server = app.listen(port, "0.0.0.0", () => {
  console.log(`Server is up and running on port ${port}`);
});
socketService.initSocket(server);

// -----------Utils----------------------- //
const { connect, changeUserBalance, checkUserExists, addSurveyCompletion, canWithdraw, withdraw } = require('./utils/dbChange');
const { getRandomInt, generateRandomHash, round } = require('./utils/randomHash.js');

// -----------Route Links----------------- //
const loginRoute = require('./routes/login.js');
const promoRoute = require('./routes/promocode.js');
const homeRoute = require('./routes/homepage.js');
const earnRoute = require('./routes/earn.js');
const walletRoute = require('./routes/wallet.js');
const userAPI = require('./api/userAPI.js');

// -----------Middleware------------------ //
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('trust proxy', true);
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'views')));
app.use(cookieParser());
app.use(bodyParser.json());

// -----------Routes---------------------- //
app.get('/404', (req, res) => {
  res.sendFile(path.join(__dirname, './views/404page.html'));
});
app.use('/login', loginRoute);
app.use('/promocode', promoRoute);
app.use('/earn', earnRoute);
app.use('/home', homeRoute);
app.use('/withdraw', walletRoute);
app.use('/api', userAPI);
app.use('/', homeRoute);

connect();

// -----------Discord Webhook------------- //
const discordWebhookUrl = 'https://discord.com/api/webhooks/1259268256351649822/3538y4__KKC6z_iwX3s-WFhd3R8N6zNp5CO00ubHvpdrCfo_rzC_MJWb7S8Qclb2UX9J';

const sendDiscordWebhook = async (username, amount) => {
  try {
    await axios.post(discordWebhookUrl, {
      embeds: [
        {
          title: "💰 New Survey Completion!",
          description: `**${username}** just earned **${amount} R$** from a survey!`,
          color: 0x57F287,
          footer: {
            text: "RBXPro • Survey System",
            icon_url: "https://media.discordapp.net/attachments/1002332031478419577/1326641651812143144/5a4e9f646dd92bd9562e2bf37f86ebb1.png?ex=6800b511&is=67ff6391&hm=b1112f199e0527e1100d507e0622b0d00251f785d8c8f4b37315ff52b738c74c&=&format=webp&quality=lossless"
          },
          timestamp: new Date().toISOString()
        }
      ]
    });
    console.log('✅ Discord embed sent!');
  } catch (error) {
    console.error('❌ Error sending embed:', error.message);
  }
};

// -----------Callbacks------------------- //

// BitLabs
app.get('/callback/bitlab', async (req, res) => {
  const { uid, val, usd, type, tx } = req.query;
  console.log("Bitlab:", uid, val, usd, type, tx);

  if (["COMPLETE", "START_BONUS", "RECONCILIATION", "SCREENOUT"].includes(type)) {
    if (type === "COMPLETE" && parseFloat(val) >= 2) {
      await addSurveyCompletion(uid);
    }
    try {
      const userData = await checkUserExists(uid);
      if (userData) {
        const newBal = type === 'RECONCILIATION'
          ? userData.balance - Math.abs(parseFloat(val))
          : userData.balance + parseFloat(val);
        await changeUserBalance(uid, newBal);
        await sendDiscordWebhook(userData.username, parseFloat(val));
        res.status(200).json({ status: 'success', message: 'OK' });
      } else {
        res.status(404).json({ status: 'error', message: 'User not found' });
      }
    } catch (err) {
      console.error('Callback error:', err);
      res.status(500).json({ status: 'error', message: 'Server error' });
    }
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid callback type' });
  }
});

// CPX
app.get('/callback/cpx', async (req, res) => {
  const { uid, val, type } = req.query;
  console.log("CPX", uid, val, type);

  if (["1", "2"].includes(type)) {
    if (type === "1" && parseFloat(val) >= 2) {
      await addSurveyCompletion(uid);
    }
    try {
      const userData = await checkUserExists(uid);
      if (userData) {
        const newBal = type === '1'
          ? userData.balance + parseFloat(val)
          : userData.balance - Math.abs(parseFloat(val));
        await changeUserBalance(uid, newBal);
        await sendDiscordWebhook(userData.username, parseFloat(val));
        res.status(200).json({ status: 'success', message: 'OK' });
      } else {
        res.status(404).json({ status: 'error', message: 'User not found' });
      }
    } catch (err) {
      console.error('Callback error:', err);
      res.status(500).json({ status: 'error', message: 'Server error' });
    }
  } else {
    res.status(400).json({ status: 'error', message: 'Invalid callback type' });
  }
});

// KiwiWall
app.get('/callback/kiwi', async (req, res) => {
  const { uid, val, type } = req.query;
  console.log("Kiwiwall:", uid, val, type);

  if (type === '1' && parseFloat(val) >= 2) {
    await addSurveyCompletion(uid);
  }

  try {
    const userData = await checkUserExists(uid);
    if (userData) {
      const newBal = userData.balance + parseFloat(val);
      await changeUserBalance(uid, newBal);
      await sendDiscordWebhook(userData.username, parseFloat(val));
      res.status(200).json({ status: 'success', message: 'OK' });
    } else {
      res.status(404).json({ status: 'error', message: 'User not found' });
    }
  } catch (err) {
    console.error('Callback error:', err);
    res.status(500).json({ status: 'error', message: 'Server error' });
  }
});

// RevToo
app.get('/callback/revtoo', async (req, res) => {
  const { uid, val } = req.query;
  console.log("RevToo:", uid, val);

  if (!uid || !val) return res.status(400).send('ERROR: Missing parameters');

  if (parseFloat(val) >= 2) {
    await addSurveyCompletion(uid);
  }

  try {
    const userData = await checkUserExists(uid);
    if (!userData) return res.status(404).send('ERROR: User not found');

    const newBal = userData.balance + parseFloat(val);
    await changeUserBalance(uid, newBal);
    await sendDiscordWebhook(userData.username, parseFloat(val));
    return res.status(200).send('ok');
  } catch (error) {
    console.error('Callback error:', error);
    return res.status(500).send('ERROR: Server error');
  }
});
