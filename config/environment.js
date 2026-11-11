const REQUIRED_PRODUCTION_VARIABLES = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL'];

const validateEnvironment = () => {
  const missing = REQUIRED_PRODUCTION_VARIABLES.filter((name) => !String(process.env[name] || '').trim());
  if (process.env.NODE_ENV === 'production' && missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (process.env.NODE_ENV === 'production' && String(process.env.JWT_SECRET || '').length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters in production');
  }

  const frontendUrls = String(process.env.FRONTEND_URL || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (process.env.NODE_ENV === 'production' && frontendUrls.some((url) => !url.startsWith('https://'))) {
    throw new Error('Every production FRONTEND_URL must use HTTPS');
  }

  if (process.env.USE_CLOUDINARY === 'true') {
    const cloudinaryVariables = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
    const missingCloudinary = cloudinaryVariables.filter((name) => !String(process.env[name] || '').trim());
    if (missingCloudinary.length) {
      throw new Error(`Cloudinary is enabled but variables are missing: ${missingCloudinary.join(', ')}`);
    }
  }
};

module.exports = validateEnvironment;
