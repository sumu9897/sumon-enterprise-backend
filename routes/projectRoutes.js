const express = require('express');
const router = express.Router();
const {
  getProjects,
  getProjectById,
  getProjectBySlug,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject,
  getProjectUploadSignature,
} = require('../controllers/projectController');
const { protect, authorize, hasPermission } = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');
const projectValidators = require('../validators/projectValidator');
const validate = require('../middleware/validateMiddleware');
// Public routes
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/slug/:slug', getProjectBySlug);
router.get('/:id', getProjectById);
// Protected routes (Admin only)
router.post('/images/signature', protect, authorize('projects.create', 'projects.update'), getProjectUploadSignature);
router.post(
  '/',
  protect,
  authorize('projects.create'),
  upload.array('images', 10),
  projectValidators.createProject,
  validate,
  createProject
);
router.put(
  '/:id',
  protect,
  upload.array('images', 10),
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
module.exports = router;
