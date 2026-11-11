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

module.exports = { ADMIN_PERMISSIONS, normalizePermissions };
