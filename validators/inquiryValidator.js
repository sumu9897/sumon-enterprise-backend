const { body, validationResult } = require('express-validator');

// ─── Reusable result handler ───────────────────────────────────────────────
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        statusCode: 400,
        errors: errors.array().map((err) => ({
          field: err.path || err.param,
          message: err.msg,
        })),
      },
    });
  }
  next();
};

// ─── Inquiry validator ─────────────────────────────────────────────────────
const validateInquiry = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters')
    .isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('phone')
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isLength({ min: 7 }).withMessage('Please provide a valid phone number'),

  body('subject')
    .trim()
    .notEmpty().withMessage('Subject is required')
    .isLength({ min: 3 }).withMessage('Subject must be at least 3 characters')
    .isLength({ max: 200 }).withMessage('Subject must not exceed 200 characters'),

  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ min: 10 }).withMessage('Message must be at least 10 characters')
    .isLength({ max: 2000 }).withMessage('Message must not exceed 2000 characters'),

  handleValidationErrors,
];

module.exports = { validateInquiry, handleValidationErrors };