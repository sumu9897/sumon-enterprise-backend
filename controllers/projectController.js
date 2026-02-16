const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');
const fs = require('fs').promises;
const path = require('path');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
const getProjects = async (req, res, next) => {
  try {
    const { status, company, search, page = 1, limit = 10, sort = '-startDate' } = req.query;

    // Build query
    const query = {};

    if (status) {
      query.status = status;
    }

    if (company) {
      query.company = new RegExp(company, 'i');
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Calculate pagination
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const projects = await Project.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Project.countDocuments(query);

    res.json({
      success: true,
      count: projects.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single project by ID
// @route   GET /api/projects/:id
// @access  Public
const getProjectById = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get project by slug
// @route   GET /api/projects/slug/:slug
// @access  Public
const getProjectBySlug = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          statusCode: 404,
        },
      });
    }

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured projects
// @route   GET /api/projects/featured
// @access  Public
const getFeaturedProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ featured: true })
      .sort('-startDate')
      .limit(4);

    res.json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res, next) => {
  try {
    const projectData = {
      projectName: req.body.projectName,
      company: req.body.company,
      description: req.body.description,
      address: {
        plot: req.body['address.plot'] || req.body.plot,
        road: req.body['address.road'] || req.body.road,
        block: req.body['address.block'] || req.body.block,
        area: req.body['address.area'] || req.body.area,
        city: req.body['address.city'] || req.body.city || 'Dhaka',
      },
      status: req.body.status,
      startDate: req.body.startDate,
      finishDate: req.body.finishDate || null,
      specifications: {
        floors: req.body['specifications.floors'] || req.body.floors,
        areaPerFloor: req.body['specifications.areaPerFloor'] || req.body.areaPerFloor,
        totalArea: req.body['specifications.totalArea'] || req.body.totalArea,
        constructionType: req.body['specifications.constructionType'] || req.body.constructionType,
      },
      featured: req.body.featured === 'true' || req.body.featured === true,
    };

    // Handle location coordinates
    if (req.body['location.coordinates']) {
      const coords = JSON.parse(req.body['location.coordinates']);
      projectData.location = {
        type: 'Point',
        coordinates: coords,
      };
    } else if (req.body.longitude && req.body.latitude) {
      projectData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const images = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        if (process.env.USE_CLOUDINARY === 'true') {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'sumon-enterprise',
          });

          images.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: i === 0,
          });

          // Delete local file
          await fs.unlink(file.path);
        } else {
          // Use local storage
          images.push({
            url: `/uploads/${file.filename}`,
            publicId: file.filename,
            isPrimary: i === 0,
          });
        }
      }

      projectData.images = images;
    }

    const project = await Project.create(projectData);

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project,
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    next(error);
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
const updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          statusCode: 404,
        },
      });
    }

    // Build update object
    const updateData = {};

    if (req.body.projectName) updateData.projectName = req.body.projectName;
    if (req.body.company) updateData.company = req.body.company;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.status) updateData.status = req.body.status;
    if (req.body.startDate) updateData.startDate = req.body.startDate;
    if (req.body.finishDate !== undefined) updateData.finishDate = req.body.finishDate;
    if (req.body.featured !== undefined) updateData.featured = req.body.featured === 'true' || req.body.featured === true;

    // Handle address updates
    if (req.body['address.plot'] || req.body.plot) {
      updateData['address.plot'] = req.body['address.plot'] || req.body.plot;
    }
    if (req.body['address.road'] || req.body.road) {
      updateData['address.road'] = req.body['address.road'] || req.body.road;
    }
    if (req.body['address.block'] || req.body.block) {
      updateData['address.block'] = req.body['address.block'] || req.body.block;
    }
    if (req.body['address.area'] || req.body.area) {
      updateData['address.area'] = req.body['address.area'] || req.body.area;
    }
    if (req.body['address.city'] || req.body.city) {
      updateData['address.city'] = req.body['address.city'] || req.body.city;
    }

    // Handle specifications updates
    if (req.body['specifications.floors'] || req.body.floors) {
      updateData['specifications.floors'] = req.body['specifications.floors'] || req.body.floors;
    }
    if (req.body['specifications.areaPerFloor'] || req.body.areaPerFloor) {
      updateData['specifications.areaPerFloor'] = req.body['specifications.areaPerFloor'] || req.body.areaPerFloor;
    }
    if (req.body['specifications.totalArea'] || req.body.totalArea) {
      updateData['specifications.totalArea'] = req.body['specifications.totalArea'] || req.body.totalArea;
    }
    if (req.body['specifications.constructionType'] || req.body.constructionType) {
      updateData['specifications.constructionType'] = req.body['specifications.constructionType'] || req.body.constructionType;
    }

    // Handle location updates
    if (req.body['location.coordinates']) {
      const coords = JSON.parse(req.body['location.coordinates']);
      updateData.location = {
        type: 'Point',
        coordinates: coords,
      };
    } else if (req.body.longitude && req.body.latitude) {
      updateData.location = {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)],
      };
    }

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImages = [];

      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];

        if (process.env.USE_CLOUDINARY === 'true') {
          // Upload to Cloudinary
          const result = await cloudinary.uploader.upload(file.path, {
            folder: 'sumon-enterprise',
          });

          newImages.push({
            url: result.secure_url,
            publicId: result.public_id,
            isPrimary: project.images.length === 0 && i === 0,
          });

          // Delete local file
          await fs.unlink(file.path);
        } else {
          // Use local storage
          newImages.push({
            url: `/uploads/${file.filename}`,
            publicId: file.filename,
            isPrimary: project.images.length === 0 && i === 0,
          });
        }
      }

      updateData.images = [...project.images, ...newImages];
    }

    project = await Project.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project,
    });
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach(async (file) => {
        try {
          await fs.unlink(file.path);
        } catch (err) {
          console.error('Error deleting file:', err);
        }
      });
    }
    next(error);
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Project not found',
          statusCode: 404,
        },
      });
    }

    // Delete images from Cloudinary or local storage
    if (project.images && project.images.length > 0) {
      for (const image of project.images) {
        if (process.env.USE_CLOUDINARY === 'true' && image.publicId) {
          try {
            await cloudinary.uploader.destroy(image.publicId);
          } catch (err) {
            console.error('Error deleting image from Cloudinary:', err);
          }
        } else if (image.publicId) {
          // Delete from local storage
          try {
            await fs.unlink(path.join(__dirname, '../uploads', image.publicId));
          } catch (err) {
            console.error('Error deleting local file:', err);
          }
        }
      }
    }

    await project.deleteOne();

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProjects,
  getProjectById,
  getProjectBySlug,
  getFeaturedProjects,
  createProject,
  updateProject,
  deleteProject,
};
