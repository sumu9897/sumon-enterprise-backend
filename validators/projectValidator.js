const { body } = require('express-validator');

const finishAfterStart = (value, { req }) => {
  if (!value || !req.body.startDate) return true;
  if (new Date(value) < new Date(req.body.startDate)) {
    throw new Error('Finish date cannot be before start date');
  }
  return true;
};

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
    body(['address.area', 'area'])
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage('Area must not exceed 120 characters'),
    body(['address.city', 'city'])
      .optional()
      .trim()
      .isLength({ max: 120 })
      .withMessage('City must not exceed 120 characters'),
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
      .withMessage('Invalid finish date format')
      .custom(finishAfterStart),
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
      .withMessage('Invalid finish date format')
      .custom(finishAfterStart),
  ],
};

module.exports = projectValidators;
