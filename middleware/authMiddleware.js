const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { SESSION_COOKIE, parseCookies, safeTokenEqual } = require('../utils/session');

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
  let authMethod;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
    authMethod = 'bearer';
  } else {
    token = parseCookies(req.headers.cookie)[SESSION_COOKIE];
    if (token) authMethod = 'cookie';
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.admin = await Admin.findById(decoded.id).select('+tokenVersion');
      req.authMethod = authMethod;
      req.authToken = decoded;

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

      const unsafeMethod = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
      if (authMethod === 'cookie' && unsafeMethod && !safeTokenEqual(req.get('x-csrf-token'), decoded.csrf)) {
        return res.status(403).json({
          success: false,
          error: { message: 'Invalid or missing CSRF token', statusCode: 403 },
        });
      }

      return next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Not authorized, token failed',
          statusCode: 401,
        },
      });
    }
  }

  return res.status(401).json({
    success: false,
    error: { message: 'Not authorized, no token', statusCode: 401 },
  });
};

module.exports = { protect, authorize, hasPermission };
