require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');

const email = (process.env.ADMIN_SEED_EMAIL || 'sumonconstruction2024@gmail.com').trim().toLowerCase();
const name = (process.env.ADMIN_SEED_NAME || 'Super Admin').trim();
const password = process.env.ADMIN_SEED_PASSWORD;

async function run() {
  if (process.env.CONFIRM_ADMIN_REPLACEMENT !== 'yes') {
    throw new Error('Set CONFIRM_ADMIN_REPLACEMENT=yes to replace the targeted administrator.');
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  if (!password) throw new Error('ADMIN_SEED_PASSWORD is required.');

  // Validate and hash before deleting anything, so invalid input cannot remove
  // the existing administrator and leave the application without an owner.
  const replacementData = {
    name,
    email,
    password,
    role: 'superadmin',
    isActive: true,
    passwordChangedAt: new Date(),
    tokenVersion: 0,
  };
  await new Admin(replacementData).validate();
  const passwordHash = await bcrypt.hash(password, 10);

  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const result = await Admin.deleteMany({ email }).session(session);
      await Admin.collection.insertOne({
        ...replacementData,
        _id: new mongoose.Types.ObjectId(),
        password: passwordHash,
        createdAt: new Date(),
        updatedAt: new Date(),
        __v: 0,
      }, { session });
      console.log(`Replaced ${result.deletedCount} administrator record(s).`);
    });
  } finally {
    await session.endSession();
  }

  const saved = await Admin.findOne({ email }).select('+password +tokenVersion');
  if (!saved || !saved.password.startsWith('$2')) {
    throw new Error('Administrator verification failed.');
  }

  console.log('Primary superadmin seeded successfully with a hashed password.');
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
