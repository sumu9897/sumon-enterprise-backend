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
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../utils/fileUpload');
const projectValidators = require('../validators/projectValidator');
const validate = require('../middleware/validateMiddleware');
// Public routes
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/slug/:slug', getProjectBySlug);
router.get('/:id', getProjectById);
// Protected routes (Admin only)
router.post(
  '/',
  protect,
  upload.array('images', 10),
  projectValidators.createProject,
  validate,
  createProject
);
router.put(
  '/:id',
  protect,
  upload.array('images', 10),
  projectValidators.updateProject,
  validate,
  updateProject
);
router.delete('/:id', protect, deleteProject);
module.exports = router;