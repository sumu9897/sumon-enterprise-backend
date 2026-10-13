const test = require('node:test');
const assert = require('node:assert/strict');
const Project = require('../models/Project');
const { PROJECT_STATUSES } = require('../constants/projectStatuses');

const baseProject = {
  projectName: 'Status validation project',
  company: 'M/S Sumon Enterprise',
  description: 'Project used to validate the supported construction workflow statuses.',
  startDate: new Date('2026-01-01'),
};

test('all professional project statuses pass model validation', async () => {
  for (const status of PROJECT_STATUSES) {
    await assert.doesNotReject(() => new Project({ ...baseProject, status }).validate());
  }
});

test('legacy Finished status is rejected after migration', async () => {
  await assert.rejects(() => new Project({ ...baseProject, status: 'Finished' }).validate());
});
