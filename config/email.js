const nodemailer = require('nodemailer');

const emailPort = Number.parseInt(process.env.EMAIL_PORT, 10) || 587;

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify connection configuration
transporter.verify((error) => {
  if (error) {
    console.error('Email configuration error:', error.message);
  } else {
    console.log('Email server is ready to send messages');
  }
});

module.exports = transporter;
