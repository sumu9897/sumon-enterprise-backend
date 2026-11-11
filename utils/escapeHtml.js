const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  "'": '&#39;',
  '"': '&quot;',
}[character]));

const safeEmailHeader = (value = '') => String(value).replace(/[\r\n]+/g, ' ').trim();

module.exports = { escapeHtml, safeEmailHeader };
