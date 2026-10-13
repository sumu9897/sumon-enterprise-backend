const SiteContent = require('../models/SiteContent');
const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;

const populateContent = (query) => query.populate('gallery.project', 'projectName slug status company address images');

const readContent = async () => {
  const stored = await populateContent(SiteContent.findOne({ key: 'main' })).lean();
  return stored || new SiteContent({ key: 'main' }).toObject();
};

const getSiteContent = async (_req, res, next) => {
  try {
    const content = await readContent();
    content.services = (content.services || []).filter((item) => item.active).sort((a, b) => a.order - b.order);
    content.gallery = (content.gallery || []).filter((item) => item.active && item.project).sort((a, b) => a.order - b.order);
    res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    return res.json({ success: true, data: content });
  } catch (error) { return next(error); }
};

const getAdminSiteContent = async (_req, res, next) => {
  try {
    const content = await readContent();
    res.set('Cache-Control', 'no-store');
    return res.json({ success: true, data: content });
  } catch (error) { return next(error); }
};

const updateSiteContent = async (req, res, next) => {
  try {
    const allowed = ['about', 'services', 'contact', 'gallery'];
    const update = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
    if (!Object.keys(update).length) return res.status(400).json({ success: false, error: { message: 'No editable content was provided', statusCode: 400 } });

    if (update.gallery) {
      const ids = [...new Set(update.gallery.map((item) => String(item.project || '')).filter(Boolean))];
      const existing = await Project.countDocuments({ _id: { $in: ids } });
      if (existing !== ids.length) return res.status(400).json({ success: false, error: { message: 'Every gallery item must reference an existing project', statusCode: 400 } });
    }

    const content = await SiteContent.findOneAndUpdate(
      { key: 'main' },
      { $set: { ...update, updatedBy: req.admin._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return res.json({ success: true, message: 'Website content updated successfully', data: content });
  } catch (error) { return next(error); }
};

const uploadSiteImage = async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: { message: 'Please select an image to upload', statusCode: 400 },
    });
  }

  try {
    if (process.env.USE_CLOUDINARY !== 'true') {
      await fs.unlink(req.file.path).catch(() => {});
      return res.status(503).json({
        success: false,
        error: { message: 'Cloud image storage is not configured', statusCode: 503 },
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'sumon-enterprise/site-content',
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });
    await fs.unlink(req.file.path).catch(() => {});

    return res.status(201).json({
      success: true,
      message: 'Image uploaded successfully',
      data: { url: result.secure_url, publicId: result.public_id },
    });
  } catch (error) {
    await fs.unlink(req.file.path).catch(() => {});
    return next(error);
  }
};

module.exports = { getSiteContent, getAdminSiteContent, updateSiteContent, uploadSiteImage };
