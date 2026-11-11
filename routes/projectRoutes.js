const express = require('express');
const router = express.Router();
const {
  getProjects,
  getAdminProjects,
  getProjectSummary,
  getAdminProjectById,
  getProjectById,
  getProjectBySlug,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject,
  archiveProject,
  getProjectUploadSignature,
} = require('../controllers/projectController');
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');
const projectValidators = require('../validators/projectValidator');
const validate = require('../middleware/validateMiddleware');
const { verifyImageUpload } = require('../middleware/verifyImageUpload');
// Public routes
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/slug/:slug', getProjectBySlug);
router.get('/admin/summary', protect, authorize('projects.view'), getProjectSummary);
router.get('/admin/:id', protect, authorize('projects.view'), getAdminProjectById);
router.get('/admin', protect, authorize('projects.view'), getAdminProjects);
router.get('/:id', getProjectById);
// Protected routes (Admin only)
router.post('/images/signature', protect, authorize('projects.create', 'projects.update'), getProjectUploadSignature);
router.post(
  '/',
  protect,
  authorize('projects.create'),
  upload.array('images', 10),
  verifyImageUpload,
  projectValidators.createProject,
  validate,
  createProject
);
router.put(
  '/:id',
  protect,
  upload.array('images', 10),
  verifyImageUpload,
  (req, res, next) => {
    const fields = Object.keys(req.body || {});
    const statusOnly = fields.length > 0 && fields.every((field) => field === 'status');
    const allowed = statusOnly
      ? hasPermission(req.admin, 'projects.status') || hasPermission(req.admin, 'projects.update')
      : hasPermission(req.admin, 'projects.update');
    return allowed
      ? next()
      : res.status(403).json({ success: false, error: { message: 'You do not have permission to update this project', statusCode: 403 } });
  },
  projectValidators.updateProject,
  validate,
  updateProject
);
router.delete('/:id', protect, authorize('projects.delete'), deleteProject);
router.patch('/:id/archive', protect, authorize('projects.update'), archiveProject);
module.exports = router;
