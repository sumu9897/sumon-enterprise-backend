const crypto = require('crypto');

const SESSION_COOKIE = 'sumon_admin_session';

const parseDurationMs = (value, fallbackMs) => {
  const match = String(value || '').trim().match(/^(\d+)([smhd])$/i);
  if (!match) return fallbackMs;
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return Number(match[1]) * multipliers[match[2].toLowerCase()];
};

const parseCookies = (header = '') => Object.fromEntries(
  String(header).split(';').map((part) => part.trim()).filter(Boolean).map((part) => {
    const separator = part.indexOf('=');
    if (separator < 0) return [part, ''];
    const key = part.slice(0, separator);
    const rawValue = part.slice(separator + 1);
    try { return [key, decodeURIComponent(rawValue)]; } catch { return [key, rawValue]; }
  }),
);

const cookieOptions = (remember = false) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/api',
  maxAge: parseDurationMs(
    remember ? process.env.JWT_REMEMBER_EXPIRE : process.env.JWT_EXPIRE,
    remember ? 30 * 86_400_000 : 8 * 3_600_000,
  ),
});

const setSessionCookie = (res, token, remember = false) => {
  res.cookie(SESSION_COOKIE, token, cookieOptions(remember));
};

const clearSessionCookie = (res) => {
  const options = cookieOptions(false);
  delete options.maxAge;
  res.clearCookie(SESSION_COOKIE, options);
};

const createCsrfToken = () => crypto.randomBytes(32).toString('hex');

const safeTokenEqual = (left, right) => {
  const a = Buffer.from(String(left || ''));
  const b = Buffer.from(String(right || ''));
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
};

module.exports = {
  SESSION_COOKIE,
  parseCookies,
  setSessionCookie,
  clearSessionCookie,
  createCsrfToken,
  safeTokenEqual,
};
