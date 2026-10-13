const test = require('node:test');
const assert = require('node:assert/strict');
const SiteContent = require('../models/SiteContent');

test('gallery items require a linked project', () => {
  const content = new SiteContent({ gallery: [{ imageUrl: 'https://example.com/site.jpg' }] });
  const error = content.validateSync();
  assert.equal(error.errors['gallery.0.project'].kind, 'required');
});

test('services require a title', () => {
  const content = new SiteContent({ services: [{ description: 'Construction service' }] });
  const error = content.validateSync();
  assert.equal(error.errors['services.0.title'].kind, 'required');
});

test('valid project-linked gallery content passes schema validation', () => {
  const content = new SiteContent({
    services: [{ title: 'Main Contractor', order: 0 }],
    gallery: [{ imageUrl: 'https://example.com/site.jpg', project: '507f1f77bcf86cd799439011' }],
  });
  assert.equal(content.validateSync(), undefined);
});
