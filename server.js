// !! dotenv MUST be the very first line — before any other require !!
require('dotenv').config();

const app      = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB then start ────────────────────────────────
const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

  } catch (error) {
    console.error('❌ Server startup failed:', error.message);
    // On Vercel, don't call process.exit() — it kills the function permanently
    // Instead let the error handler in app.js deal with requests
  }
};

// Vercel owns the HTTP listener. Local/VM deployments still start normally.
if (!process.env.VERCEL) {
  startServer();
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
});

module.exports = app;
