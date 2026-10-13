const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateMiddleware');
const { getSiteContent, getAdminSiteContent, updateSiteContent } = require('../controllers/siteContentController');

const router = express.Router();
router.get('/', getSiteContent);
router.get('/admin', protect, getAdminSiteContent);
router.put('/', protect, body().isObject().withMessage('Content payload is required'), validate, updateSiteContent);

module.exports = router;
