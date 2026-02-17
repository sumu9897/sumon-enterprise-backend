const express = require('express');
const router = express.Router();
const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} = require('../controllers/inquiryController');
const { validateInquiry } = require('../validators/inquiryValidator');
const { protect } = require('../middleware/auth');

// ── Public ──────────────────────────────────────────
// POST /api/inquiries — submit contact form
router.post('/', validateInquiry, createInquiry);

// ── Protected (Admin) ───────────────────────────────
// GET  /api/inquiries/stats
router.get('/stats', protect, getInquiryStats);

// GET  /api/inquiries
router.get('/', protect, getInquiries);

// GET  /api/inquiries/:id
router.get('/:id', protect, getInquiryById);

// PUT  /api/inquiries/:id/status
router.put('/:id/status', protect, updateInquiryStatus);

// DELETE /api/inquiries/:id
router.delete('/:id', protect, deleteInquiry);

module.exports = router;