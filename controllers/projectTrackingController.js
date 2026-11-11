const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMilestone = require('../models/ProjectMilestone');
const ProgressUpdate = require('../models/ProgressUpdate');
const writeAuditLog = require('../utils/audit');

const assertProject = async (id) => {
  if (!mongoose.isValidObjectId(id) || !await Project.exists({ _id: id })) throw Object.assign(new Error('Project not found'), { statusCode: 404 });
};
const calculateWeightedProgress = (packages = []) => {
  if (!packages.length) return null;
  const total = packages.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (Math.abs(total - 100) > 0.01) throw Object.assign(new Error('Work package weights must total 100%'), { statusCode: 400 });
  return Number((packages.reduce((sum, item) => sum + Number(item.weight) * Number(item.completion), 0) / total).toFixed(2));
};
const getWorkspace = async (req, res, next) => {
  try { await assertProject(req.params.projectId); const [milestones, progress] = await Promise.all([ProjectMilestone.find({ project: req.params.projectId }).populate('responsiblePerson', 'name email role').sort({ plannedCompletionDate: 1 }), ProgressUpdate.find({ project: req.params.projectId }).populate('submittedBy reviewedBy', 'name email role').sort({ reportingDate: -1 })]); return res.json({ success: true, data: { milestones, progress } }); } catch (error) { return next(error); }
};
const getPublicTracking = async (req, res, next) => {
  try { const visible = await Project.exists({ _id: req.params.projectId, $or: [{ publishStatus: 'published' }, { publishStatus: { $exists: false } }] }); if (!visible) return res.status(404).json({ success: false, error: { message: 'Project not found', statusCode: 404 } }); const [milestones, progress] = await Promise.all([ProjectMilestone.find({ project: req.params.projectId, publicVisible: true, status: { $ne: 'Cancelled' } }).select('title description plannedStartDate plannedCompletionDate actualCompletionDate status completionPercentage').sort({ plannedCompletionDate: 1 }).lean(), ProgressUpdate.find({ project: req.params.projectId, approvalStatus: 'approved', publicVisible: true }).select('reportingDate phase plannedProgress actualProgress progressVariance weightedPhysicalProgress workCompleted').sort({ reportingDate: -1 }).limit(12).lean()]); return res.json({ success: true, data: { milestones, progress } }); } catch (error) { return next(error); }
};
const getTrackingSummary = async (_req, res, next) => {
  try { const now = new Date(); const next30 = new Date(now.getTime() + 30 * 86400000); const staleDate = new Date(now.getTime() - 30 * 86400000); const [upcomingMilestones, overdueMilestones, delayedMilestones, latest] = await Promise.all([ProjectMilestone.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] }, plannedCompletionDate: { $gte: now, $lte: next30 } }), ProjectMilestone.countDocuments({ status: { $nin: ['Completed', 'Cancelled'] }, plannedCompletionDate: { $lt: now } }), ProjectMilestone.countDocuments({ status: 'Delayed' }), ProgressUpdate.aggregate([{ $sort: { reportingDate: -1 } }, { $group: { _id: '$project', reportingDate: { $first: '$reportingDate' } } }, { $match: { reportingDate: { $lt: staleDate } } }, { $count: 'count' }])]); return res.json({ success: true, data: { upcomingMilestones, overdueMilestones, delayedMilestones, projectsAwaitingUpdates: latest[0]?.count || 0 } }); } catch (error) { return next(error); }
};
const createMilestone = async (req, res, next) => {
  try { await assertProject(req.params.projectId); const milestone = await ProjectMilestone.create({ ...req.body, project: req.params.projectId, createdBy: req.admin._id, updatedBy: req.admin._id }); await writeAuditLog(req, 'project.milestone_created', 'success', req.admin, { projectId: req.params.projectId, milestoneId: milestone._id }); return res.status(201).json({ success: true, data: milestone }); } catch (error) { return next(error); }
};
const updateMilestone = async (req, res, next) => {
  try { const milestone = await ProjectMilestone.findOne({ _id: req.params.id, project: req.params.projectId }); if (!milestone) return res.status(404).json({ success: false, error: { message: 'Milestone not found', statusCode: 404 } }); const allowed = ['title', 'description', 'plannedStartDate', 'plannedCompletionDate', 'actualCompletionDate', 'responsiblePerson', 'status', 'priority', 'completionPercentage', 'remarks', 'publicVisible']; allowed.forEach((key) => { if (req.body[key] !== undefined) milestone[key] = req.body[key]; }); milestone.updatedBy = req.admin._id; if (milestone.status === 'Completed' && !milestone.actualCompletionDate) milestone.actualCompletionDate = new Date(); await milestone.save(); await writeAuditLog(req, 'project.milestone_updated', 'success', req.admin, { projectId: req.params.projectId, milestoneId: milestone._id }); return res.json({ success: true, data: milestone }); } catch (error) { return next(error); }
};
const createProgress = async (req, res, next) => {
  try { await assertProject(req.params.projectId); const packages = Array.isArray(req.body.workPackages) ? req.body.workPackages : []; const weighted = calculateWeightedProgress(packages); const actual = weighted ?? Number(req.body.actualProgress); if (!Number.isFinite(actual)) throw Object.assign(new Error('Actual progress is required when work packages are not provided'), { statusCode: 400 }); const progress = await ProgressUpdate.create({ ...req.body, project: req.params.projectId, workPackages: packages, actualProgress: actual, weightedPhysicalProgress: weighted, progressVariance: Number((actual - Number(req.body.plannedProgress)).toFixed(2)), submittedBy: req.admin._id }); await writeAuditLog(req, 'project.progress_created', 'success', req.admin, { projectId: req.params.projectId, progressId: progress._id }); return res.status(201).json({ success: true, data: progress }); } catch (error) { return next(error); }
};
const reviewProgress = async (req, res, next) => {
  try { if (!['approved', 'rejected'].includes(req.body.approvalStatus)) return res.status(400).json({ success: false, error: { message: 'Invalid review decision', statusCode: 400 } }); const progress = await ProgressUpdate.findOne({ _id: req.params.id, project: req.params.projectId }); if (!progress) return res.status(404).json({ success: false, error: { message: 'Progress update not found', statusCode: 404 } }); if (progress.approvalStatus === 'approved') return res.status(409).json({ success: false, error: { message: 'Approved progress snapshots are immutable', statusCode: 409 } }); progress.approvalStatus = req.body.approvalStatus; progress.publicVisible = req.body.approvalStatus === 'approved' && req.body.publicVisible === true; progress.reviewedBy = req.admin._id; progress.reviewedAt = new Date(); await progress.save(); await writeAuditLog(req, 'project.progress_reviewed', 'success', req.admin, { projectId: req.params.projectId, progressId: progress._id, approvalStatus: progress.approvalStatus }); return res.json({ success: true, data: progress }); } catch (error) { return next(error); }
};
module.exports = { calculateWeightedProgress, getWorkspace, getPublicTracking, getTrackingSummary, createMilestone, updateMilestone, createProgress, reviewProgress };
