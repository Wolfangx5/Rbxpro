const express = require('express');
const fs = require('fs');
const app = express();
const axios = require('axios')
const cheerio = require('cheerio');
const WebSocket = require('ws');
const wait = require('wait');
const { channel } = require('diagnostics_channel');
const crypto = require('crypto');
const res = require('express/lib/response');
const { getRandomInt, generateRandomHash, round } = require('./utils/randomHash.js');





const wss = new WebSocket.Server({ server });


const broadcastHeader = () => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(round(multi, 2));
    }
  });
};