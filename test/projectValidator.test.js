const test = require('node:test');
const assert = require('node:assert/strict');
const { validationResult } = require('express-validator');
const projectValidators = require('../validators/projectValidator');

const validateUpdate = async (body) => {
  const req = { body };
  for (const validator of projectValidators.updateProject) await validator.run(req);
  return validationResult(req).array();
};

test('project update accepts an empty optional finish date from legacy clients', async () => {
  assert.deepEqual(await validateUpdate({ finishDate: '' }), []);
});

test('project update still rejects a non-empty invalid finish date', async () => {
  const errors = await validateUpdate({ finishDate: 'not-a-date' });
  assert.equal(errors[0].path, 'finishDate');
  assert.equal(errors[0].msg, 'Invalid finish date format');
});
