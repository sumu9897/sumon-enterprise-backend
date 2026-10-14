const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const hasPermission = (admin, permission) => (
  admin?.role === 'superadmin' || admin?.permissions?.includes(permission)
);

const authorize = (...permissions) => (req, res, next) => {
  if (permissions.some((permission) => hasPermission(req.admin, permission))) return next();
  return res.status(403).json({
    success: false,
    error: { message: 'You do not have permission to perform this action', statusCode: 403 },
  });
};

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
      req.admin = await Admin.findById(decoded.id).select('+tokenVersion');

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

      if ((decoded.version || 0) !== (req.admin.tokenVersion || 0)) {
        return res.status(401).json({
          success: false,
          error: { message: 'Session has expired. Please sign in again.', statusCode: 401 },
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

module.exports = { protect, authorize, hasPermission };
