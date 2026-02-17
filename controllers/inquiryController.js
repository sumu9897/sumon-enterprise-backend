const Inquiry = require('../models/Inquiry');
const { sendInquiryNotification, sendInquiryConfirmation } = require('../utils/emailService');

// @desc    Create new inquiry (public)
// @route   POST /api/inquiries
// @access  Public
const createInquiry = async (req, res, next) => {
  try {
    // Extract exactly the fields the frontend sends
    const { name, email, phone, subject, message } = req.body;

    // Create inquiry in database
    const inquiry = await Inquiry.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    // Send emails in background (don't block response)
    Promise.all([
      sendInquiryNotification(inquiry).catch(err =>
        console.error('Admin notification email failed:', err)
      ),
      sendInquiryConfirmation(inquiry).catch(err =>
        console.error('Confirmation email failed:', err)
      ),
    ]);

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully',
      data: {
        id: inquiry._id,
        name: inquiry.name,
        email: inquiry.email,
        subject: inquiry.subject,
        createdAt: inquiry.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all inquiries (admin)
// @route   GET /api/inquiries
// @access  Private/Admin
const getInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Inquiry.countDocuments(query);

    const inquiries = await Inquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      count: inquiries.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
      data: inquiries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single inquiry (admin)
// @route   GET /api/inquiries/:id
// @access  Private/Admin
const getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);
    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Inquiry not found', statusCode: 404 },
      });
    }
    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry status (admin)
// @route   PUT /api/inquiries/:id/status
// @access  Private/Admin
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['unread', 'read', 'replied'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid status value', statusCode: 400 },
      });
    }

    const inquiry = await Inquiry.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Inquiry not found', statusCode: 404 },
      });
    }

    res.status(200).json({ success: true, data: inquiry });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inquiry (admin)
// @route   DELETE /api/inquiries/:id
// @access  Private/Admin
const deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findByIdAndDelete(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: { message: 'Inquiry not found', statusCode: 404 },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inquiry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inquiry stats (admin)
// @route   GET /api/inquiries/stats
// @access  Private/Admin
const getInquiryStats = async (req, res, next) => {
  try {
    const [total, unread, read, replied] = await Promise.all([
      Inquiry.countDocuments(),
      Inquiry.countDocuments({ status: 'unread' }),
      Inquiry.countDocuments({ status: 'read' }),
      Inquiry.countDocuments({ status: 'replied' }),
    ]);

    res.status(200).json({
      success: true,
      data: { total, unread, read, replied },
    });
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