require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

const email = (process.env.PRIMARY_ADMIN_EMAIL || 'sumonconstruction2024@gmail.com').trim().toLowerCase();

async function run() {
  if (process.env.CONFIRM_PRIMARY_ADMIN_MIGRATION !== 'yes') {
    throw new Error('Set CONFIRM_PRIMARY_ADMIN_MIGRATION=yes for this one-time migration.');
  }
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const admin = await Admin.findOne({ email });
  if (!admin) throw new Error(`No existing administrator was found for ${email}. Nothing was created.`);
  if (admin.role === 'superadmin') {
    console.log('Primary administrator is already a superadmin. No change required.');
    return;
  }
  admin.role = 'superadmin';
  await admin.save({ validateBeforeSave: false });
  console.log('Primary administrator was promoted without changing the password.');
}

run()
  .catch((error) => { console.error(error.message); process.exitCode = 1; })
  .finally(() => mongoose.disconnect());
