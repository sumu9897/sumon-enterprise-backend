const Inquiry = require('../models/Inquiry');
const Admin = require('../models/Admin');
const writeAuditLog = require('../utils/audit');
const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Safe email sender — NEVER crashes the request if email fails
const safeSendEmails = async (inquiry) => {
  try {
    const { sendInquiryNotification, sendInquiryConfirmation } = require('../utils/sendEmail');
    await Promise.allSettled([
      sendInquiryNotification(inquiry),
      sendInquiryConfirmation(inquiry),
    ]);
  } catch (err) {
    // Log but NEVER throw — email failure must not crash the inquiry save
    console.error('Email sending failed (non-fatal):', err.message);
  }
};

// @desc  Create new inquiry
// @route POST /api/inquiries
// @access Public
const createInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Save to MongoDB
    const inquiry = await Inquiry.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Send emails in background — will NOT crash request if email fails
    safeSendEmails(inquiry);

    return res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. We will contact you soon.',
      data: {
        id:        inquiry._id,
        name:      inquiry.name,
        email:     inquiry.email,
        subject:   inquiry.subject,
        createdAt: inquiry.createdAt,
      },
    });

  } catch (error) {
    next(error);
  }
};

// @desc  Get all inquiries
// @route GET /api/inquiries
// @access Private/Admin
const getInquiries = async (req, res, next) => {
  try {
    const { status, assignedTo, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && ['unread', 'read', 'replied'].includes(status)) query.status = status;
    if (assignedTo === 'unassigned') query.assignedTo = null;
    else if (assignedTo) query.assignedTo = assignedTo;
    if (search) {
      const pattern = new RegExp(escapeRegex(String(search).slice(0, 100)), 'i');
      query.$or = [{ name: pattern }, { email: pattern }, { phone: pattern }, { subject: pattern }];
    }

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [total, inquiries] = await Promise.all([
      Inquiry.countDocuments(query),
      Inquiry.find(query).populate('assignedTo', 'name email role').populate('internalNotes.author', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum),
    ]);

    return res.status(200).json({
      success: true,
      count: inquiries.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      data: inquiries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc  Get single inquiry
// @route GET /api/inquiries/:id
// @access Private/Admin
const getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id).populate('assignedTo', 'name email role').populate('internalNotes.author', 'name email');
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    }
    await writeAuditLog(req, 'inquiry.status_updated', 'success', req.admin, { inquiryId: inquiry._id, status });
    return res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

const assignInquiry = async (req, res, next) => {
  try {
    const assignedTo = req.body.assignedTo || null;
    if (assignedTo && !await Admin.exists({ _id: assignedTo, isActive: true })) return res.status(400).json({ success: false, error: { message: 'Selected administrator is not active', statusCode: 400 } });
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { assignedTo }, { new: true, runValidators: true }).populate('assignedTo', 'name email role');
    if (!inquiry) return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    await writeAuditLog(req, 'inquiry.assigned', 'success', req.admin, { inquiryId: inquiry._id, assignedTo });
    return res.json({ success: true, message: assignedTo ? 'Inquiry assigned' : 'Inquiry unassigned', data: inquiry });
  } catch (error) { return next(error); }
};

const addInquiryNote = async (req, res, next) => {
  try {
    const text = String(req.body.text || '').trim();
    if (!text || text.length > 2000) return res.status(400).json({ success: false, error: { message: 'Note must be between 1 and 2000 characters', statusCode: 400 } });
    const inquiry = await Inquiry.findByIdAndUpdate(req.params.id, { $push: { internalNotes: { text, author: req.admin._id } } }, { new: true, runValidators: true }).populate('internalNotes.author', 'name email');
    if (!inquiry) return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    await writeAuditLog(req, 'inquiry.note_added', 'success', req.admin, { inquiryId: inquiry._id });
    return res.status(201).json({ success: true, message: 'Internal note added', data: inquiry });
  } catch (error) { return next(error); }
};

// @desc  Update inquiry status
// @route PUT /api/inquiries/:id/status
// @access Private/Admin
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({ success: false, error: { message: 'Invalid status', statusCode: 400 } });
    }
    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id, { status }, { new: true }
    );
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    }
    await writeAuditLog(req, 'inquiry.deleted', 'success', req.admin, { inquiryId: inquiry._id, email: inquiry.email });
    return res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc  Delete inquiry
// @route DELETE /api/inquiries/:id
// @access Private/Admin
const deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    }
    return res.status(200).json({ success: true, message: 'Inquiry deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc  Get stats
// @route GET /api/inquiries/stats
// @access Private/Admin
const getInquiryStats = async (req, res, next) => {
  try {
    const [total, unread, read, replied] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'unread' }),
      Inquiry.countDocuments({ status: 'read' }),
      Inquiry.countDocuments({ status: 'replied' }),
    ]);
    return res.status(200).json({ success: true, data: { total, unread, read, replied } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createInquiry,
  getInquiries,
  getInquiryById,
  updateInquiryStatus,
  assignInquiry,
  addInquiryNote,
  deleteInquiry,
  getInquiryStats,
};
