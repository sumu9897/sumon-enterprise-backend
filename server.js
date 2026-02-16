require('dotenv').config();
const app = require('../src/app');
const connectDB = require('../src/config/database');

// Connect DB (serverless safe)
let isConnected = false;

async function handler(req, res) {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }

  return app(req, res);
}

module.exports = handler;
