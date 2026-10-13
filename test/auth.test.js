const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');

test('JWT contains the session revocation version', () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  process.env.JWT_EXPIRE = '8h';
  const admin = { _id: '507f1f77bcf86cd799439011', tokenVersion: 4 };
  const decoded = jwt.verify(generateToken(admin), process.env.JWT_SECRET);
  assert.equal(decoded.id, admin._id);
  assert.equal(decoded.version, 4);
});

test('password model validation rejects fewer than 12 characters', async () => {
  const admin = new Admin({ name: 'Test Admin', email: 'admin@example.com', password: 'too-short' });
  const error = admin.validateSync();
  assert.match(error.errors.password.message, /at least 12 characters/);
});

test('primary administrator role is never inferred from email by the model', () => {
  const admin = new Admin({ name: 'Primary', email: 'sumonconstruction2024@gmail.com', password: 'long-enough-password' });
  assert.equal(admin.role, 'admin');
});
