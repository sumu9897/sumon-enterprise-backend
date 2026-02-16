const { body } = require('express-validator');

const projectValidators = {
  createProject: [
    body('projectName')
      .trim()
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ min: 3 })
      .withMessage('Project name must be at least 3 characters'),
    body('company')
      .trim()
      .notEmpty()
      .withMessage('Company name is required'),
    body('description')
      .trim()
      .notEmpty()
      .withMessage('Description is required')
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('address.area')
      .trim()
      .notEmpty()
      .withMessage('Area is required'),
    body('address.city')
      .trim()
      .notEmpty()
      .withMessage('City is required'),
    body('status')
      .isIn(['Ongoing', 'Finished'])
      .withMessage('Status must be either Ongoing or Finished'),
    body('startDate')
      .notEmpty()
      .withMessage('Start date is required')
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('finishDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid finish date format'),
  ],

  updateProject: [
    body('projectName')
      .optional()
      .trim()
      .isLength({ min: 3 })
      .withMessage('Project name must be at least 3 characters'),
    body('company')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Company name cannot be empty'),
    body('description')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('Description must be at least 10 characters'),
    body('status')
      .optional()
      .isIn(['Ongoing', 'Finished'])
      .withMessage('Status must be either Ongoing or Finished'),
    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid start date format'),
    body('finishDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid finish date format'),
  ],
};

module.exports = projectValidators;
