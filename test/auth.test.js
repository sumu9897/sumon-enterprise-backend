const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const generateToken = require('../utils/generateToken');
const { normalizePermissions } = require('../constants/adminPermissions');
const { authorize } = require('../middleware/authMiddleware');

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

test('permission normalization removes unknown and duplicate permissions', () => {
  assert.deepEqual(
    normalizePermissions(['projects.view', 'unknown.permission', 'projects.view', 'projects.status']),
    ['projects.view', 'projects.status'],
  );
});

test('admin model rejects unknown permissions', () => {
  const admin = new Admin({
    name: 'Restricted Admin',
    email: 'restricted@example.com',
    password: 'long-enough-password',
    permissions: ['projects.view', 'projects.destroy_everything'],
  });
  const error = admin.validateSync();
  assert.equal(error.errors['permissions.1'].kind, 'enum');
});

test('authorization permits assigned access and always permits superadmin', () => {
  const middleware = authorize('projects.update');
  let nextCalls = 0;
  const next = () => { nextCalls += 1; };
  middleware({ admin: { role: 'admin', permissions: ['projects.update'] } }, {}, next);
  middleware({ admin: { role: 'superadmin', permissions: [] } }, {}, next);
  assert.equal(nextCalls, 2);
});

test('authorization rejects missing access with 403', () => {
  let result;
  const res = {
    status(code) { result = { code }; return this; },
    json(body) { result.body = body; return this; },
  };
  authorize('projects.delete')({ admin: { role: 'admin', permissions: ['projects.view'] } }, res, () => {});
  assert.equal(result.code, 403);
  assert.equal(result.body.error.statusCode, 403);
});
