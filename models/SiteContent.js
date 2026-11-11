const mongoose = require('mongoose');

const text = (max = 500) => ({ type: String, trim: true, maxlength: max });
const httpsUrl = (max = 1000) => ({
  ...text(max),
  validate: {
    validator: (value) => !value || /^https:\/\//i.test(value),
    message: 'URL must use HTTPS',
  },
});
const googleMapUrl = {
  ...httpsUrl(2000),
  validate: {
    validator: (value) => {
      if (!value) return true;
      try {
        const hostname = new URL(value).hostname.toLowerCase();
        return hostname === 'google.com' || hostname.endsWith('.google.com');
      } catch { return false; }
    },
    message: 'Map URL must be a valid Google HTTPS embed URL',
  },
};

const siteContentSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true, immutable: true },
  about: {
    eyebrow: { ...text(80), default: 'Our Story' },
    title: { ...text(160), default: 'About M/S Sumon Enterprise' },
    subtitle: { ...text(300), default: "Building Bangladesh's future with construction excellence" },
    heading: { ...text(160), default: 'Building Trust Since 2000' },
    paragraphs: [{ ...text(2000) }],
    imageUrl: httpsUrl(1000),
    milestones: [{ year: text(20), title: text(160), description: text(500) }],
    values: [{ title: text(160), description: text(500) }],
  },
  services: [{
    title: { ...text(160), required: true },
    tagline: text(200),
    description: text(1000),
    imageUrl: httpsUrl(1000),
    features: [{ ...text(300) }],
    order: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  }],
  contact: {
    phone: text(40),
    whatsapp: text(40),
    email: text(254),
    address: text(500),
    mapEmbedUrl: googleMapUrl,
    facebookUrl: httpsUrl(1000),
    officeHours: [{ day: text(20), hours: text(80), open: { type: Boolean, default: true } }],
  },
  gallery: [{
    imageUrl: { ...httpsUrl(1000), required: true },
    caption: text(300),
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    order: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  }],
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
}, { timestamps: true });

siteContentSchema.index({ 'services.order': 1 });
siteContentSchema.index({ 'gallery.order': 1 });

module.exports = mongoose.model('SiteContent', siteContentSchema);
