const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get admin from token
      req.admin = await Admin.findById(decoded.id).select('-password');

      if (!req.admin) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Not authorized, admin not found',
            statusCode: 401,
          },
        });
      }

      if (!req.admin.isActive) {
        return res.status(401).json({
          success: false,
          error: {
            message: 'Account is inactive',
            statusCode: 401,
          },
        });
      }

      next();
    } catch (error) {
      console.error(error);
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, token failed',
          statusCode: 401,
        },
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        message: 'Not authorized, no token',
        statusCode: 401,
      },
    });
  }
};

module.exports = { protect };
