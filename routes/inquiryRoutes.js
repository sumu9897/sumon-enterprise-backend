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
const { protect } = require('../middleware/authMiddleware');
const { validateInquiry } = require('../validators/inquiryValidator');

// ── PUBLIC ──────────────────────────────────────────────────────
// POST /api/inquiries
router.post('/', validateInquiry, createInquiry);

// ── ADMIN (protected) ────────────────────────────────────────────
// NOTE: /stats MUST come before /:id to avoid Express treating "stats" as an id
router.get('/stats',       protect, getInquiryStats);
router.get('/',            protect, getInquiries);
router.get('/:id',         protect, getInquiryById);
router.put('/:id/status',  protect, updateInquiryStatus);
router.delete('/:id',      protect, deleteInquiry);

module.exports = router;
