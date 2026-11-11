const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  plannedStartDate: Date,
  plannedCompletionDate: { type: Date, required: true },
  actualCompletionDate: Date,
  responsiblePerson: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
  status: { type: String, enum: ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold', 'Cancelled'], default: 'Not Started', index: true },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
  remarks: { type: String, trim: true, maxlength: 2000, default: '' },
  publicVisible: { type: Boolean, default: false },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
}, { timestamps: true });
schema.index({ project: 1, plannedCompletionDate: 1 });
module.exports = mongoose.model('ProjectMilestone', schema);
