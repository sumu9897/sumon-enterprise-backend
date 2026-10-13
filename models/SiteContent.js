const mongoose = require('mongoose');

const text = (max = 500) => ({ type: String, trim: true, maxlength: max });

const siteContentSchema = new mongoose.Schema({
  key: { type: String, default: 'main', unique: true, immutable: true },
  about: {
    eyebrow: { ...text(80), default: 'Our Story' },
    title: { ...text(160), default: 'About M/S Sumon Enterprise' },
    subtitle: { ...text(300), default: "Building Bangladesh's future with construction excellence" },
    heading: { ...text(160), default: 'Building Trust Since 2000' },
    paragraphs: [{ ...text(2000) }],
    imageUrl: text(1000),
    milestones: [{ year: text(20), title: text(160), description: text(500) }],
    values: [{ title: text(160), description: text(500) }],
  },
  services: [{
    title: { ...text(160), required: true },
    tagline: text(200),
    description: text(1000),
    imageUrl: text(1000),
    features: [{ ...text(300) }],
    order: { type: Number, min: 0, default: 0 },
    active: { type: Boolean, default: true },
  }],
  contact: {
    phone: text(40),
    whatsapp: text(40),
    email: text(254),
    address: text(500),
    mapEmbedUrl: text(2000),
    facebookUrl: text(1000),
    officeHours: [{ day: text(20), hours: text(80), open: { type: Boolean, default: true } }],
  },
  gallery: [{
    imageUrl: { ...text(1000), required: true },
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
