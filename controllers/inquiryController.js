const Inquiry = require('../models/Inquiry');
const { sendInquiryNotification, sendInquiryConfirmation } = require('../utils/sendEmail');

// @desc    Get all inquiries
// @route   GET /api/inquiries
// @access  Private
const getInquiries = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20, sort = '-createdAt' } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const inquiries = await Inquiry.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Inquiry.countDocuments(query);

    res.json({
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

// @desc    Get single inquiry
// @route   GET /api/inquiries/:id
// @access  Private
const getInquiryById = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inquiry not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new inquiry (Contact form submission)
// @route   POST /api/inquiries
// @access  Public
const createInquiry = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Get IP address and user agent
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('user-agent');

    const inquiry = await Inquiry.create({
      name,
      email,
      phone,
      subject,
      message,
      ipAddress,
      userAgent,
    });

    // Send email notifications
    try {
      await Promise.all([
        sendInquiryNotification(inquiry),
        sendInquiryConfirmation(inquiry),
      ]);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully. We will contact you soon.',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update inquiry status
// @route   PUT /api/inquiries/:id/status
// @access  Private
const updateInquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    let inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inquiry not found',
          statusCode: 404,
        },
      });
    }

    inquiry.status = status;
    
    // Set readAt timestamp when marked as read
    if (status === 'read' && !inquiry.readAt) {
      inquiry.readAt = Date.now();
    }

    await inquiry.save();

    res.json({
      success: true,
      message: 'Inquiry status updated successfully',
      data: inquiry,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete inquiry
// @route   DELETE /api/inquiries/:id
// @access  Private
const deleteInquiry = async (req, res, next) => {
  try {
    const inquiry = await Inquiry.findById(req.params.id);

    if (!inquiry) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Inquiry not found',
          statusCode: 404,
        },
      });
    }

    await inquiry.deleteOne();

    res.json({
      success: true,
      message: 'Inquiry deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inquiry statistics
// @route   GET /api/inquiries/stats
// @access  Private
const getInquiryStats = async (req, res, next) => {
  try {
    const total = await Inquiry.countDocuments();
    const unread = await Inquiry.countDocuments({ status: 'unread' });
    const read = await Inquiry.countDocuments({ status: 'read' });
    const replied = await Inquiry.countDocuments({ status: 'replied' });

    res.json({
      success: true,
      data: {
        total,
        unread,
        read,
        replied,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getInquiries,
  getInquiryById,
  createInquiry,
  updateInquiryStatus,
  deleteInquiry,
  getInquiryStats,
};
