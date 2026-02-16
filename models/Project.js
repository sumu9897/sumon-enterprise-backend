const mongoose = require('mongoose');
const slugify = require('slugify');

const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
      required: [true, 'Please provide project name'],
      trim: true,
    },
    company: {
      type: String,
      required: [true, 'Please provide company name'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide project description'],
    },
    address: {
      plot: {
        type: String,
        trim: true,
      },
      road: {
        type: String,
        trim: true,
      },
      block: {
        type: String,
        trim: true,
      },
      area: {
        type: String,
        required: [true, 'Please provide area'],
        trim: true,
      },
      city: {
        type: String,
        required: [true, 'Please provide city'],
        default: 'Dhaka',
        trim: true,
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [90.4125, 23.8103], // Default: Dhaka coordinates
      },
    },
    status: {
      type: String,
      enum: ['Ongoing', 'Finished'],
      required: [true, 'Please provide project status'],
    },
    startDate: {
      type: Date,
      required: [true, 'Please provide start date'],
    },
    finishDate: {
      type: Date,
      default: null,
    },
    images: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
        },
        caption: {
          type: String,
          default: '',
        },
        isPrimary: {
          type: Boolean,
          default: false,
        },
      },
    ],
    specifications: {
      floors: {
        type: String,
        trim: true,
      },
      areaPerFloor: {
        type: String,
        trim: true,
      },
      totalArea: {
        type: String,
        trim: true,
      },
      constructionType: {
        type: String,
        trim: true,
      },
    },
    slug: {
      type: String,
      unique: true,
    },
    featured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create 2dsphere index for geospatial queries
projectSchema.index({ location: '2dsphere' });

// Create text index for search
projectSchema.index({ projectName: 'text', description: 'text', company: 'text' });

// Generate slug before saving
projectSchema.pre('save', function (next) {
  if (!this.isModified('projectName') && !this.isModified('company')) {
    return next();
  }
  
  const slugText = `${this.projectName} ${this.company}`;
  this.slug = slugify(slugText, { lower: true, strict: true });
  next();
});

// Virtual for full address
projectSchema.virtual('fullAddress').get(function () {
  const parts = [];
  
  if (this.address.plot) parts.push(`Plot ${this.address.plot}`);
  if (this.address.road) parts.push(`Road ${this.address.road}`);
  if (this.address.block) parts.push(`Block ${this.address.block}`);
  if (this.address.area) parts.push(this.address.area);
  if (this.address.city) parts.push(this.address.city);
  
  return parts.join(', ');
});

// Ensure virtuals are included in JSON
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
