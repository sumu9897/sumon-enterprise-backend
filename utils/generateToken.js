const jwt = require('jsonwebtoken');

const generateToken = (admin, remember = false, csrfToken = '') => {
  return jwt.sign({ id: admin._id, version: admin.tokenVersion || 0, csrf: csrfToken }, process.env.JWT_SECRET, {
    expiresIn: remember ? (process.env.JWT_REMEMBER_EXPIRE || '30d') : (process.env.JWT_EXPIRE || '8h'),
  });
};

module.exports = generateToken;
