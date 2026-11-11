const SiteContent = require('../models/SiteContent');
const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const writeAuditLog = require('../utils/audit');

const EDITABLE_SECTIONS = ['homepage', 'company', 'about', 'services', 'contact', 'gallery', 'achievements', 'testimonials'];
const editablePayload = (body) => Object.fromEntries(EDITABLE_SECTIONS.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

const validateGalleryProjects = async (gallery) => {
  if (!gallery) return;
  const ids = [...new Set(gallery.map((item) => String(item.project?._id || item.project || '')).filter(Boolean))];
  const existing = await Project.countDocuments({ _id: { $in: ids } });
  if (existing !== ids.length) throw Object.assign(new Error('Every gallery item must reference an existing project'), { statusCode: 400 });
};

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
    const update = editablePayload(req.body);
    if (!Object.keys(update).length) return res.status(400).json({ success: false, error: { message: 'No editable content was provided', statusCode: 400 } });

    await validateGalleryProjects(update.gallery);

    const content = await SiteContent.findOneAndUpdate(
      { key: 'main' },
      { $set: { ...update, draftContent: null, publishedAt: new Date(), updatedBy: req.admin._id } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
    await writeAuditLog(req, 'content.published', 'success', req.admin, { sections: Object.keys(update) });
    return res.json({ success: true, message: 'Website content published successfully', data: content });
  } catch (error) { return next(error); }
};

const saveDraft = async (req, res, next) => {
  try {
    const draft = editablePayload(req.body);
    if (!Object.keys(draft).length) return res.status(400).json({ success: false, error: { message: 'No editable content was provided', statusCode: 400 } });
    await validateGalleryProjects(draft.gallery);
    const candidate = new SiteContent({ key: `draft-${Date.now()}`, ...draft });
    const validation = candidate.validateSync();
    if (validation) throw Object.assign(new Error(Object.values(validation.errors)[0]?.message || 'Draft validation failed'), { statusCode: 400 });
    const content = await SiteContent.findOneAndUpdate({ key: 'main' }, { $set: { draftContent: draft, updatedBy: req.admin._id } }, { new: true, upsert: true, setDefaultsOnInsert: true });
    await writeAuditLog(req, 'content.draft_saved', 'success', req.admin, { sections: Object.keys(draft) });
    return res.json({ success: true, message: 'Draft saved successfully', data: content });
  } catch (error) { return next(error); }
};

const publishDraft = async (req, res, next) => {
  try {
    const existing = await SiteContent.findOne({ key: 'main' });
    if (!existing?.draftContent) return res.status(400).json({ success: false, error: { message: 'There is no saved draft to publish', statusCode: 400 } });
    const draft = editablePayload(existing.draftContent);
    await validateGalleryProjects(draft.gallery);
    const content = await SiteContent.findOneAndUpdate({ key: 'main' }, { $set: { ...draft, draftContent: null, publishedAt: new Date(), updatedBy: req.admin._id } }, { new: true, runValidators: true });
    await writeAuditLog(req, 'content.published', 'success', req.admin, { sections: Object.keys(draft), source: 'draft' });
    return res.json({ success: true, message: 'Draft published successfully', data: content });
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

module.exports = { getSiteContent, getAdminSiteContent, updateSiteContent, saveDraft, publishDraft, uploadSiteImage };
