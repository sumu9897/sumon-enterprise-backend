const express = require('express');
const router = express.Router();
const { register, login, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const registrationEnabled = (req, res, next) => {
  if (process.env.ALLOW_ADMIN_REGISTRATION === 'true') return next();
  return res.status(404).json({
    success: false,
    error: { message: 'Route not found', statusCode: 404 },
  });
};

router.post('/register', registrationEnabled, register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
module.exports = router;
