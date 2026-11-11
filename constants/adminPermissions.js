const ADMIN_PERMISSIONS = Object.freeze([
  'projects.view',
  'projects.create',
  'projects.update',
  'projects.status',
  'projects.delete',
  'projects.publish',
  'inquiries.view',
  'inquiries.update',
  'inquiries.delete',
  'content.update',
  'content.publish',
  'audit.view',
  'users.manage',
]);

const normalizePermissions = (permissions) => (
  Array.isArray(permissions)
    ? [...new Set(permissions.filter((permission) => ADMIN_PERMISSIONS.includes(permission)))]
    : []
);

const ROLE_PERMISSION_PRESETS = Object.freeze({
  viewer: ['projects.view', 'inquiries.view'],
  editor: ['projects.view', 'projects.create', 'projects.update', 'projects.status', 'inquiries.view', 'inquiries.update', 'content.update'],
  admin: ADMIN_PERMISSIONS.filter((permission) => permission !== 'users.manage'),
});

module.exports = { ADMIN_PERMISSIONS, normalizePermissions, ROLE_PERMISSION_PRESETS };
