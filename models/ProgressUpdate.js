const mongoose = require('mongoose');
const workPackage = new mongoose.Schema({ name: { type: String, required: true, trim: true, maxlength: 160 }, weight: { type: Number, required: true, min: 0, max: 100 }, completion: { type: Number, required: true, min: 0, max: 100 } }, { _id: false });
const schema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  reportingDate: { type: Date, required: true, index: true }, reportingPeriod: { type: String, trim: true, maxlength: 100, default: '' }, phase: { type: String, required: true, trim: true, maxlength: 160 },
  plannedProgress: { type: Number, required: true, min: 0, max: 100 }, actualProgress: { type: Number, required: true, min: 0, max: 100 }, progressVariance: { type: Number, required: true }, weightedPhysicalProgress: { type: Number, min: 0, max: 100, default: null }, workPackages: [workPackage],
  workCompleted: { type: String, trim: true, maxlength: 5000, default: '' }, nextPeriodPlan: { type: String, trim: true, maxlength: 5000, default: '' }, issues: { type: String, trim: true, maxlength: 5000, default: '' }, managementActions: { type: String, trim: true, maxlength: 5000, default: '' },
  approvalStatus: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft', index: true }, publicVisible: { type: Boolean, default: false },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true }, reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null }, reviewedAt: Date,
}, { timestamps: true });
schema.index({ project: 1, reportingDate: -1 });
module.exports = mongoose.model('ProgressUpdate', schema);
