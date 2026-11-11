const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ADMIN_PERMISSIONS } = require('../constants/adminPermissions');

const adminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide password'],
      minlength: [12, 'Password must be at least 12 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin', 'superadmin'],
      default: 'admin',
    },
    permissions: [{
      type: String,
      enum: ADMIN_PERMISSIONS,
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    passwordChangedAt: Date,
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    passwordResetUsedAt: { type: Date, select: false },
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const configuredRounds = Number.parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
  const salt = await bcrypt.genSalt(Math.min(14, Math.max(10, configuredRounds)));
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare password
adminSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

adminSchema.index({ passwordResetTokenHash: 1 }, { sparse: true });

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
