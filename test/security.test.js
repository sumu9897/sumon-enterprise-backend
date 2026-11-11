const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');
const { parseCookies, safeTokenEqual } = require('../utils/session');
const { detectImageType } = require('../middleware/verifyImageUpload');
const { escapeHtml, safeEmailHeader } = require('../utils/escapeHtml');
const Admin = require('../models/Admin');
const { protect } = require('../middleware/authMiddleware');

const runProtection = async ({ csrfHeader }) => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  const admin = {
    _id: '507f1f77bcf86cd799439011',
    role: 'admin',
    permissions: [],
    isActive: true,
    tokenVersion: 0,
  };
  const token = generateToken(admin, false, 'bound-csrf-token');
  const originalFindById = Admin.findById;
  Admin.findById = () => ({ select: async () => admin });
  let response;
  let nextCalled = false;
  const req = {
    method: 'POST',
    headers: { cookie: `sumon_admin_session=${encodeURIComponent(token)}` },
    get(name) { return name.toLowerCase() === 'x-csrf-token' ? csrfHeader : undefined; },
  };
  const res = {
    status(code) { response = { code }; return this; },
    json(body) { response.body = body; return this; },
  };
  try {
    await protect(req, res, () => { nextCalled = true; });
  } finally {
    Admin.findById = originalFindById;
  }
  return { nextCalled, response, req };
};

test('JWT binds a CSRF token to the authenticated session', () => {
  process.env.JWT_SECRET = 'test-secret-with-at-least-thirty-two-characters';
  const token = generateToken({ _id: '507f1f77bcf86cd799439011', tokenVersion: 2 }, false, 'csrf-value');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(decoded.csrf, 'csrf-value');
  assert.equal(decoded.version, 2);
});

test('cookie parsing preserves encoded session values', () => {
  assert.deepEqual(parseCookies('theme=dark; sumon_admin_session=abc%2E123'), {
    theme: 'dark',
    sumon_admin_session: 'abc.123',
  });
});

test('CSRF comparison is safe for matching and mismatched values', () => {
  assert.equal(safeTokenEqual('same-token', 'same-token'), true);
  assert.equal(safeTokenEqual('same-token', 'different-token'), false);
  assert.equal(safeTokenEqual('', ''), false);
});

test('image content detection accepts supported signatures and rejects spoofed text', () => {
  assert.equal(detectImageType(Buffer.from('ffd8ffe000104a464946', 'hex')), 'image/jpeg');
  assert.equal(detectImageType(Buffer.from('89504e470d0a1a0a00000000', 'hex')), 'image/png');
  assert.equal(detectImageType(Buffer.from('524946460000000057454250', 'hex')), 'image/webp');
  assert.equal(detectImageType(Buffer.from('<script>alert(1)</script>')), null);
});

test('email template helpers neutralize HTML and header injection', () => {
  assert.equal(escapeHtml('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(safeEmailHeader('Subject\r\nBcc: attacker@example.com'), 'Subject Bcc: attacker@example.com');
});

test('cookie authentication accepts the CSRF token bound to its JWT', async () => {
  const result = await runProtection({ csrfHeader: 'bound-csrf-token' });
  assert.equal(result.nextCalled, true);
  assert.equal(result.req.authMethod, 'cookie');
});

test('cookie authentication rejects a missing CSRF token on state-changing requests', async () => {
  const result = await runProtection({ csrfHeader: undefined });
  assert.equal(result.nextCalled, false);
  assert.equal(result.response.code, 403);
  assert.equal(result.response.body.error.message, 'Invalid or missing CSRF token');
});
