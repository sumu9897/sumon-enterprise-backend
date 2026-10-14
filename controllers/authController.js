const crypto = require('crypto');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const writeAuditLog = require('../utils/audit');
const { sendPasswordResetEmail, sendPasswordChangedEmail } = require('../utils/sendEmail');
const { normalizePermissions } = require('../constants/adminPermissions');

const PRIMARY_ADMIN_EMAIL = (process.env.PRIMARY_ADMIN_EMAIL || 'sumonconstruction2024@gmail.com').toLowerCase();
const RESET_TTL_MS = 15 * 60 * 1000;
const GENERIC_RESET_MESSAGE = 'If an active administrator account matches that email, a recovery link has been sent.';
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const publicAdmin = (admin) => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  role: admin.role,
  permissions: admin.role === 'superadmin' ? ['*'] : (admin.permissions || []),
  isActive: admin.isActive,
  lastLogin: admin.lastLogin,
  createdAt: admin.createdAt,
});

const register = async (req, res, next) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (await Admin.exists({ email })) return res.status(409).json({ success: false, error: { message: 'Administrator already exists', statusCode: 409 } });
    const admin = await Admin.create({
      name: req.body.name.trim(),
      email,
      password: req.body.password,
      role: 'admin',
      permissions: normalizePermissions(req.body.permissions),
    });
    await writeAuditLog(req, 'admin.created', 'success', admin);
    return res.status(201).json({ success: true, message: 'Administrator created', data: { admin: publicAdmin(admin) } });
  } catch (error) { return next(error); }
};

const listAdmins = async (_req, res, next) => {
  try {
    const admins = await Admin.find({}).sort({ role: -1, createdAt: 1 });
    return res.json({ success: true, data: admins.map(publicAdmin) });
  } catch (error) { return next(error); }
};

const updateAdminAccess = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id).select('+tokenVersion');
    if (!admin) return res.status(404).json({ success: false, error: { message: 'Administrator not found', statusCode: 404 } });
    if (admin.role === 'superadmin') return res.status(403).json({ success: false, error: { message: 'The primary administrator access cannot be changed here', statusCode: 403 } });

    if (req.body.name !== undefined) admin.name = String(req.body.name).trim();
    if (req.body.permissions !== undefined) admin.permissions = normalizePermissions(req.body.permissions);
    if (req.body.isActive !== undefined) admin.isActive = req.body.isActive === true;
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();
    await writeAuditLog(req, 'admin.access_updated', 'success', admin, {
      permissions: admin.permissions,
      isActive: admin.isActive,
    });
    return res.json({ success: true, message: 'Administrator access updated', data: publicAdmin(admin) });
  } catch (error) { return next(error); }
};

const deleteAdmin = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ success: false, error: { message: 'Administrator not found', statusCode: 404 } });
    if (admin.role === 'superadmin' || String(admin._id) === String(req.admin._id)) {
      return res.status(403).json({ success: false, error: { message: 'This administrator cannot be deleted', statusCode: 403 } });
    }
    await writeAuditLog(req, 'admin.deleted', 'success', admin);
    await admin.deleteOne();
    return res.json({ success: true, message: 'Administrator deleted' });
  } catch (error) { return next(error); }
};

const login = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email: normalizeEmail(req.body.email) }).select('+password +tokenVersion');
    const valid = admin && admin.isActive && await admin.comparePassword(req.body.password || '');
    if (!valid) {
      await writeAuditLog(req, 'auth.login', 'failure', admin, { reason: 'invalid_credentials' });
      return res.status(401).json({ success: false, error: { message: 'Invalid credentials', statusCode: 401 } });
    }
    admin.lastLogin = new Date();
    await admin.save();
    await writeAuditLog(req, 'auth.login', 'success', admin);
    return res.json({ success: true, message: 'Login successful', data: { admin: publicAdmin(admin), token: generateToken(admin, req.body.remember === true) } });
  } catch (error) { return next(error); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const admin = await Admin.findOne({ email: normalizeEmail(req.body.email), isActive: true }).select('+passwordResetTokenHash +passwordResetExpiresAt');
    if (!admin) {
      await writeAuditLog(req, 'auth.password_reset_requested', 'success', null, { accountMatched: false });
      return res.json({ success: true, message: GENERIC_RESET_MESSAGE });
    }
    const rawToken = crypto.randomBytes(32).toString('hex');
    admin.passwordResetTokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    admin.passwordResetExpiresAt = new Date(Date.now() + RESET_TTL_MS);
    admin.passwordResetUsedAt = undefined;
    await admin.save({ validateBeforeSave: false });
    const frontendUrl = (process.env.FRONTEND_URL || '').split(',')[0].trim().replace(/\/$/, '');
    if ((!frontendUrl || !frontendUrl.startsWith('https://')) && process.env.NODE_ENV === 'production') throw new Error('A secure FRONTEND_URL is required for password recovery');
    const resetUrl = `${frontendUrl || 'http://localhost:5173'}/admin/reset-password?token=${encodeURIComponent(rawToken)}`;
    try {
      await sendPasswordResetEmail(admin, resetUrl);
    } catch (error) {
      admin.passwordResetTokenHash = undefined;
      admin.passwordResetExpiresAt = undefined;
      await admin.save({ validateBeforeSave: false });
      throw error;
    }
    await writeAuditLog(req, 'auth.password_reset_requested', 'success', admin, { accountMatched: true });
    return res.json({ success: true, message: GENERIC_RESET_MESSAGE });
  } catch (error) { return next(error); }
};

const resetPassword = async (req, res, next) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(String(req.body.token || '')).digest('hex');
    const admin = await Admin.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpiresAt: { $gt: new Date() }, passwordResetUsedAt: { $exists: false }, isActive: true })
      .select('+passwordResetTokenHash +passwordResetExpiresAt +passwordResetUsedAt +tokenVersion');
    if (!admin) {
      await writeAuditLog(req, 'auth.password_reset', 'failure', null, { reason: 'invalid_or_expired_token' });
      return res.status(400).json({ success: false, error: { message: 'This recovery link is invalid or has expired.', statusCode: 400 } });
    }
    admin.password = req.body.password;
    admin.passwordChangedAt = new Date();
    admin.passwordResetUsedAt = new Date();
    admin.passwordResetTokenHash = undefined;
    admin.passwordResetExpiresAt = undefined;
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();
    await writeAuditLog(req, 'auth.password_reset', 'success', admin);
    await sendPasswordChangedEmail(admin);
    return res.json({ success: true, message: 'Password updated. Please sign in with your new password.' });
  } catch (error) { return next(error); }
};

const changePassword = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id).select('+password +tokenVersion');
    if (!admin || !await admin.comparePassword(req.body.currentPassword || '')) {
      await writeAuditLog(req, 'auth.password_change', 'failure', req.admin, { reason: 'invalid_current_password' });
      return res.status(400).json({ success: false, error: { message: 'Current password is incorrect.', statusCode: 400 } });
    }
    admin.password = req.body.password;
    admin.passwordChangedAt = new Date();
    admin.tokenVersion = (admin.tokenVersion || 0) + 1;
    await admin.save();
    await writeAuditLog(req, 'auth.password_change', 'success', admin);
    await sendPasswordChangedEmail(admin);
    return res.json({ success: true, message: 'Password changed. Please sign in again.' });
  } catch (error) { return next(error); }
};

const getMe = async (req, res) => res.json({ success: true, data: publicAdmin(req.admin) });
const logout = async (req, res) => { await writeAuditLog(req, 'auth.logout', 'success', req.admin); return res.json({ success: true, message: 'Logged out successfully' }); };
const logoutAll = async (req, res, next) => {
  try {
    await Admin.updateOne({ _id: req.admin._id }, { $inc: { tokenVersion: 1 } });
    await writeAuditLog(req, 'auth.logout_all', 'success', req.admin);
    return res.json({ success: true, message: 'All sessions have been signed out.' });
  } catch (error) { return next(error); }
};
const promotePrimaryAdmin = async (req, res, next) => {
  try {
    if (req.admin.role !== 'superadmin') return res.status(403).json({ success: false, error: { message: 'Forbidden', statusCode: 403 } });
    const admin = await Admin.findOneAndUpdate({ email: PRIMARY_ADMIN_EMAIL }, { role: 'superadmin' }, { new: true });
    if (!admin) return res.status(404).json({ success: false, error: { message: 'Primary administrator account was not found.', statusCode: 404 } });
    await writeAuditLog(req, 'admin.primary_promoted', 'success', req.admin, { target: admin._id });
    return res.json({ success: true, message: 'Primary administrator role verified.', data: { admin: publicAdmin(admin) } });
  } catch (error) { return next(error); }
};

module.exports = { register, login, forgotPassword, resetPassword, changePassword, getMe, logout, logoutAll, promotePrimaryAdmin, listAdmins, updateAdminAccess, deleteAdmin };
