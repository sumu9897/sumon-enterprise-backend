const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const inquiryRoutes = require('./routes/inquiryRoutes');
const siteContentRoutes = require('./routes/siteContentRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sumon-enterprise.vercel.app',
  ...(process.env.FRONTEND_URL || '').split(',').map((value) => value.trim()).filter(Boolean),
]);

app.use((req, res, next) => {
  req.id = req.get('x-request-id') || crypto.randomUUID();
  res.set('x-request-id', req.id);
  next();
});

app.use(cors({
  origin(origin, callback) {
    const isLoopbackOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || '');
    if (!origin || allowedOrigins.has(origin) || isLoopbackOrigin) return callback(null, true);
    const error = new Error('Origin is not allowed');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

const containsUnsafeKey = (value) => {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(([key, child]) => (
    key.startsWith('$') || key === '__proto__' || containsUnsafeKey(child)
  ));
};

app.use((req, res, next) => {
  if (containsUnsafeKey(req.body) || containsUnsafeKey(req.query) || containsUnsafeKey(req.params)) {
    return res.status(400).json({
      success: false,
      error: { message: 'Request contains unsupported field names', statusCode: 400, requestId: req.id },
    });
  }
  next();
});

app.use('/api/auth', (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

const rateLimitMessage = (message) => ({
  success: false,
  error: { message, statusCode: 429 },
});

const apiLimiter = rateLimit({
  windowMs: Number.parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  limit: Number.parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Too many requests. Please try again later.'),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Too many sign-in attempts. Please wait and try again.'),
});

const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Too many recovery attempts. Please wait and try again.'),
});

const inquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: rateLimitMessage('Too many inquiries. Please try again later.'),
});

app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', recoveryLimiter);
app.use('/api/auth/reset-password', recoveryLimiter);
app.use('/api/inquiries', (req, res, next) => (
  req.method === 'POST' ? inquiryLimiter(req, res, next) : next()
));
app.use('/uploads', express.static(path.join('/tmp', 'uploads'), {
  fallthrough: false,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
}));

app.get('/api/health', (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  res.status(databaseReady ? 200 : 503).json({
    success: databaseReady,
    message: databaseReady ? 'Service is healthy' : 'Service is starting',
    data: {
      status: databaseReady ? 'ok' : 'degraded',
      database: databaseReady ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/site-content', siteContentRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: 'Route not found', statusCode: 404 },
  });
});

app.use(errorHandler);

module.exports = app;
