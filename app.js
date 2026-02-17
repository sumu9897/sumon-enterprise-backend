const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');

const app = express();

// ══════════════════════════════════════════════════════════════════
// 1. CORS — manually set headers FIRST before anything else
//    This ensures CORS headers survive even if a later middleware crashes
// ══════════════════════════════════════════════════════════════════
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://sumon-enterprise.vercel.app',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin || ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin',      origin || '*');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods',     'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers',     'Content-Type,Authorization,X-Requested-With');
    res.setHeader('Access-Control-Max-Age',           '86400');
  }

  // Handle preflight OPTIONS instantly — never pass to routes
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// ══════════════════════════════════════════════════════════════════
// 2. Helmet — AFTER cors, with minimal settings
// ══════════════════════════════════════════════════════════════════
app.use(helmet({
  crossOriginResourcePolicy:   { policy: 'cross-origin' },
  contentSecurityPolicy:        false,
  crossOriginOpenerPolicy:      false,
}));

// ══════════════════════════════════════════════════════════════════
// 3. Body parsers
// ══════════════════════════════════════════════════════════════════
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ══════════════════════════════════════════════════════════════════
// 4. Logging
// ══════════════════════════════════════════════════════════════════
app.use(morgan('dev'));

// ══════════════════════════════════════════════════════════════════
// 5. Rate limiting
// ══════════════════════════════════════════════════════════════════
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      100,
  standardHeaders: true,
  legacyHeaders:   false,
  message: {
    success: false,
    error: { message: 'Too many requests, please try again later.', statusCode: 429 },
  },
});
app.use('/api/', limiter);

// ══════════════════════════════════════════════════════════════════
// 6. Static files
// ══════════════════════════════════════════════════════════════════
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ══════════════════════════════════════════════════════════════════
// 7. Health check — visit this to confirm server is alive
//    https://sumon-enterprise-backend.vercel.app/api/health
// ══════════════════════════════════════════════════════════════════
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success:        true,
    message:        'Server is running ✅',
    environment:    process.env.NODE_ENV || 'production',
    timestamp:      new Date().toISOString(),
    envCheck: {
      MONGODB_URI:   process.env.MONGODB_URI   ? '✅ Set' : '❌ MISSING',
      JWT_SECRET:    process.env.JWT_SECRET    ? '✅ Set' : '❌ MISSING',
      EMAIL_FROM:    process.env.EMAIL_FROM    ? '✅ Set' : '❌ MISSING',
      CONTACT_EMAIL: process.env.CONTACT_EMAIL ? '✅ Set' : '❌ MISSING',
      EMAIL_USER:    process.env.EMAIL_USER    ? '✅ Set' : '❌ MISSING',
      EMAIL_PASS:    process.env.EMAIL_PASS    ? '✅ Set' : '❌ MISSING',
      FRONTEND_URL:  process.env.FRONTEND_URL  ? '✅ Set' : '❌ MISSING',
    },
    allowedOrigins: ALLOWED_ORIGINS,
  });
});

// ══════════════════════════════════════════════════════════════════
// 8. API Routes — lazy loaded to prevent startup crashes
// ══════════════════════════════════════════════════════════════════
try {
  const authRoutes     = require('./routes/authRoutes');
  const projectRoutes  = require('./routes/projectRoutes');
  const inquiryRoutes  = require('./routes/inquiryRoutes');

  app.use('/api/auth',      authRoutes);
  app.use('/api/projects',  projectRoutes);
  app.use('/api/inquiries', inquiryRoutes);

  console.log('✅ All routes loaded');
} catch (err) {
  console.error('❌ Route loading failed:', err.message);
}

// ══════════════════════════════════════════════════════════════════
// 9. 404
// ══════════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `Route ${req.originalUrl} not found`, statusCode: 404 },
  });
});

// ══════════════════════════════════════════════════════════════════
// 10. Global error handler
// ══════════════════════════════════════════════════════════════════
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      statusCode,
    },
  });
});

module.exports = app;