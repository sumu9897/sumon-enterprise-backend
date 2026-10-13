const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null, index: true },
  action: { type: String, required: true, index: true },
  outcome: { type: String, enum: ['success', 'failure'], required: true },
  ip: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  requestId: { type: String, default: '' },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
