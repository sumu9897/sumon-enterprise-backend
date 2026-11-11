const express = require('express');
const { body } = require('express-validator');
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');
const validate = require('../middleware/validateMiddleware');
const { getSiteContent, getAdminSiteContent, updateSiteContent, saveDraft, publishDraft, uploadSiteImage } = require('../controllers/siteContentController');
const { verifyImageUpload } = require('../middleware/verifyImageUpload');

const router = express.Router();
router.get('/', getSiteContent);
router.get('/admin', protect, authorize('content.update'), getAdminSiteContent);
router.post('/images', protect, authorize('content.update'), upload.single('image'), verifyImageUpload, uploadSiteImage);
router.put('/', protect, authorize('content.update'), body().isObject().withMessage('Content payload is required'), validate, updateSiteContent);
router.put('/draft', protect, authorize('content.update'), body().isObject().withMessage('Content payload is required'), validate, saveDraft);
router.post('/publish', protect, authorize('content.publish', 'content.update'), publishDraft);

module.exports = router;
