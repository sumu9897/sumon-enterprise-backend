const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

// @desc    Register admin
// @route   POST /api/auth/register
// @access  Public (should be protected or removed in production)
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if admin already exists
    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Admin already exists with this email',
          statusCode: 400,
        },
      });
    }

    // Create admin
    const admin = await Admin.create({
      name,
      email,
      password,
    });

    if (admin) {
      res.status(201).json({
        success: true,
        message: 'Admin registered successfully',
        data: {
          admin: {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            role: admin.role,
          },
          token: generateToken(admin._id),
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Login admin
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Please provide email and password',
          statusCode: 400,
        },
      });
    }

    // Check for admin (include password field)
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          statusCode: 401,
        },
      });
    }

    // Check if password matches
    const isMatch = await admin.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid credentials',
          statusCode: 401,
        },
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Account is inactive',
          statusCode: 401,
        },
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          _id: admin._id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        },
        token: generateToken(admin._id),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current admin profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const admin = await Admin.findById(req.admin._id);

    res.json({
      success: true,
      data: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout admin
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
