// !! dotenv MUST be the very first line — before any other require !!
require('dotenv').config();

const mongoose = require('mongoose');
const app      = require('./app');

const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB then start ────────────────────────────────
const startServer = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set!');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log('✅ MongoDB Connected');

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    // On Vercel, don't call process.exit() — it kills the function permanently
    // Instead let the error handler in app.js deal with requests
  }
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

module.exports = app;