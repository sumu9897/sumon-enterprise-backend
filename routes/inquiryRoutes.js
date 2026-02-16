const express = require('express');
const router = express.Router();
const {
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} = require('../controllers/inquiryController');
const { protect } = require('../middleware/authMiddleware');
const inquiryValidators = require('../validators/inquiryValidator');
const validate = require('../middleware/validateMiddleware');
// Public routes
router.post(
  '/',
  inquiryValidators.createInquiry,
  validate,
  createInquiry
);
// Protected routes (Admin only)
router.get('/', protect, getInquiries);
router.get('/stats', protect, getInquiryStats);
router.get('/:id', protect, getInquiryById);
router.put(
  '/:id/status',
  protect,
  inquiryValidators.updateStatus,
  validate,
  updateInquiryStatus
);
router.delete('/:id', protect, deleteInquiry);
module.exports = router;