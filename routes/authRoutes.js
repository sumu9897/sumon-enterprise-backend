const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const validate = require('../middleware/validateMiddleware');
const { register, login, forgotPassword, resetPassword, changePassword, getMe, logout, logoutAll, promotePrimaryAdmin } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const requireSuperadmin = (req, res, next) => req.admin.role === 'superadmin'
  ? next()
  : res.status(403).json({ success: false, error: { message: 'Forbidden', statusCode: 403 } });

const emailRule = body('email').trim().isEmail().withMessage('Please provide a valid email').normalizeEmail();
const passwordRule = (field = 'password') => body(field)
  .isString().withMessage('Password is required')
  .isLength({ min: 12, max: 128 }).withMessage('Password must be between 12 and 128 characters');

router.post('/register', protect, requireSuperadmin, body('name').trim().isLength({ min: 2, max: 100 }), emailRule, passwordRule(), validate, register);
router.post('/login', emailRule, body('password').isString().notEmpty(), body('remember').optional().isBoolean(), validate, login);
router.post('/forgot-password', emailRule, validate, forgotPassword);
router.post('/reset-password', body('token').isHexadecimal().isLength({ min: 64, max: 64 }), passwordRule(), validate, resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);
router.post('/change-password', protect, body('currentPassword').isString().notEmpty(), passwordRule(), validate, changePassword);
router.post('/migrations/primary-admin', protect, promotePrimaryAdmin);
module.exports = router;
