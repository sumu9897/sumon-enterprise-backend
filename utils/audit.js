const AuditLog = require('../models/AuditLog');

const writeAuditLog = async (req, action, outcome, admin = null, metadata = {}) => {
  try {
    await AuditLog.create({
      admin: admin?._id || admin || null,
      action,
      outcome,
      ip: req.ip,
      userAgent: String(req.get('user-agent') || '').slice(0, 500),
      requestId: req.id,
      metadata,
    });
  } catch (error) {
    console.error(`[${req.id || 'no-request-id'}] Audit log write failed:`, error.message);
  }
};

module.exports = writeAuditLog;
