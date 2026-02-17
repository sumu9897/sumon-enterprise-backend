const Inquiry = require('../models/Inquiry');

// Safe email sender — NEVER crashes the request if email fails
const safeSendEmails = async (inquiry) => {
  try {
    const { sendInquiryNotification, sendInquiryConfirmation } = require('../utils/emailService');
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
const createInquiry = async (req, res) => {
  try {
    console.log('📩 Inquiry request body:', JSON.stringify(req.body));

    const { name, email, phone, subject, message } = req.body;

    // Manual validation — skip express-validator for now
    const missing = [];
    if (!name?.trim())    missing.push('name');
    if (!email?.trim())   missing.push('email');
    if (!phone?.trim())   missing.push('phone');
    if (!subject?.trim()) missing.push('subject');
    if (!message?.trim()) missing.push('message');

    if (missing.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Missing required fields: ${missing.join(', ')}`,
          statusCode: 400,
        },
      });
    }

    // Save to MongoDB
    const inquiry = await Inquiry.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    console.log('✅ Inquiry saved:', inquiry._id);

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
    console.error('❌ createInquiry error:', error);

    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => ({
        field:   e.path,
        message: e.message,
      }));
      return res.status(400).json({
        success: false,
        error: { message: 'Validation failed', statusCode: 400, errors },
      });
    }

    return res.status(500).json({
      success: false,
      error: {
        message: 'Server error. Please try again.',
        statusCode: 500,
        detail: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};

// @desc  Get all inquiries
// @route GET /api/inquiries
// @access Private/Admin
const getInquiries = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inquiry.countDocuments(query);

    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      count: inquiries.length,
      pagination: {
        page:  parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: inquiries,
    });
  } catch (error) {
    console.error('getInquiries error:', error);
    return res.status(500).json({ success: false, error: { message: 'Server error', statusCode: 500 } });
  }
};

// @desc  Get single inquiry
// @route GET /api/inquiries/:id
// @access Private/Admin
const getInquiryById = async (req, res) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    }
    return res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Server error', statusCode: 500 } });
  }
};

// @desc  Update inquiry status
// @route PUT /api/inquiries/:id/status
// @access Private/Admin
const updateInquiryStatus = async (req, res) => {
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
    return res.status(500).json({ success: false, error: { message: 'Server error', statusCode: 500 } });
  }
};

// @desc  Delete inquiry
// @route DELETE /api/inquiries/:id
// @access Private/Admin
const deleteInquiry = async (req, res) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);
    if (!inquiry) {
      return res.status(404).json({ success: false, error: { message: 'Inquiry not found', statusCode: 404 } });
    }
    return res.status(200).json({ success: true, message: 'Inquiry deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Server error', statusCode: 500 } });
  }
};

// @desc  Get stats
// @route GET /api/inquiries/stats
// @access Private/Admin
const getInquiryStats = async (req, res) => {
  try {
    const [total, unread, read, replied] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'unread' }),
      Inquiry.countDocuments({ status: 'read' }),
      Inquiry.countDocuments({ status: 'replied' }),
    ]);
    return res.status(200).json({ success: true, data: { total, unread, read, replied } });
  } catch (error) {
    return res.status(500).json({ success: false, error: { message: 'Server error', statusCode: 500 } });
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