const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateWeightedProgress } = require('../controllers/projectTrackingController');

test('weighted physical progress is calculated from configured work packages', () => {
  assert.equal(calculateWeightedProgress([
    { name: 'Structure', weight: 60, completion: 80 },
    { name: 'Finishes', weight: 40, completion: 25 },
  ]), 58);
});

test('work package weights must total 100 percent', () => {
  assert.throws(() => calculateWeightedProgress([{ name: 'Structure', weight: 80, completion: 50 }]), /total 100%/);
});

test('projects without work packages may use direct physical progress', () => {
  assert.equal(calculateWeightedProgress([]), null);
});
