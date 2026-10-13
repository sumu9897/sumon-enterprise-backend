const Inquiry = require('../models/Inquiry');

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
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const pageNum = Math.max(1, Number.parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;
    const [total, inquiries] = await Promise.all([
      Inquiry.countDocuments(query),
      Inquiry.find(query)
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
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    }
    return res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
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
  deleteInquiry,
  getInquiryStats,
};
