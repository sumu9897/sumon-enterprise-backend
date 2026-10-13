require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

async function run() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  const result = await Project.updateMany({ status: 'Finished' }, { $set: { status: 'Completed' } });
  console.log(`Migrated ${result.modifiedCount} project status record(s) from Finished to Completed.`);
}

run()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) await mongoose.disconnect();
  });
