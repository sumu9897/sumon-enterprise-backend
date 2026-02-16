const { body } = require('express-validator');

const inquiryValidators = {
  createInquiry: [
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ min: 2 })
      .withMessage('Name must be at least 2 characters'),
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please provide a valid email address')
      .normalizeEmail(),
    body('phone')
      .trim()
      .notEmpty()
      .withMessage('Phone number is required')
      .matches(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/)
      .withMessage('Please provide a valid phone number'),
    body('subject')
      .trim()
      .notEmpty()
      .withMessage('Subject is required')
      .isLength({ min: 5 })
      .withMessage('Subject must be at least 5 characters'),
    body('message')
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ min: 10 })
      .withMessage('Message must be at least 10 characters'),
  ],

  updateStatus: [
    body('status')
      .isIn(['unread', 'read', 'replied'])
      .withMessage('Status must be unread, read, or replied'),
  ],
};

module.exports = inquiryValidators;
