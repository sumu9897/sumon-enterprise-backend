const express = require('express');
const router  = express.Router();

const {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
} = require('../controllers/inquiryController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { validateInquiry } = require('../validators/inquiryValidator');

// ── PUBLIC ──────────────────────────────────────────────────────
// POST /api/inquiries
router.post('/', validateInquiry, createInquiry);

// ── ADMIN (protected) ────────────────────────────────────────────
// NOTE: /stats MUST come before /:id to avoid Express treating "stats" as an id
router.get('/stats',       protect, authorize('inquiries.view'), getInquiryStats);
router.get('/',            protect, authorize('inquiries.view'), getInquiries);
router.get('/:id',         protect, authorize('inquiries.view'), getInquiryById);
router.put('/:id/status',  protect, authorize('inquiries.update'), updateInquiryStatus);
router.delete('/:id',      protect, authorize('inquiries.delete'), deleteInquiry);

module.exports = router;
