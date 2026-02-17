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

// Try to load auth middleware — adjust path to match YOUR project structure
let protect;
try {
  protect = require('../middleware/auth').protect;
} catch (e) {
  try {
    protect = require('../middleware/authMiddleware').protect;
  } catch (e2) {
    try {
      protect = require('../middlewares/auth').protect;
    } catch (e3) {
      console.warn('⚠️  Auth middleware not found — admin routes will be unprotected temporarily');
      protect = (req, res, next) => next(); // fallback: no protection
    }
  }
}

// ── PUBLIC ──────────────────────────────────────────────────────
// POST /api/inquiries
router.post('/', createInquiry);

// ── ADMIN (protected) ────────────────────────────────────────────
// NOTE: /stats MUST come before /:id to avoid Express treating "stats" as an id
router.get('/stats',       protect, getInquiryStats);
router.get('/',            protect, getInquiries);
router.get('/:id',         protect, getInquiryById);
router.put('/:id/status',  protect, updateInquiryStatus);
router.delete('/:id',      protect, deleteInquiry);

module.exports = router;