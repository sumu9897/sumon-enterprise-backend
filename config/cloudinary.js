const cloudinary = require('cloudinary').v2;

// Configure Cloudinary if enabled
if (process.env.USE_CLOUDINARY === 'true') {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  console.log('Cloudinary configured');
}

module.exports = cloudinary;
