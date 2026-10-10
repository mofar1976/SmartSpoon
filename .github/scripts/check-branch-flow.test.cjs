const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateBranchFlow } = require('./check-branch-flow.cjs');
const repository = 'owner/SmartSpoon';
const check = (base, head, headRepository = repository) =>
  validateBranchFlow({ base, head, headRepository, repository });

test('work branches enter develop, including contributions from forks', () => {
  assert.equal(check('develop', 'refactor/auth'), null);
  assert.equal(check('develop', 'main', 'contributor/SmartSpoon'), null);
});
test('only develop -> preview -> main promotes within the repository', () => {
  assert.equal(check('preview', 'develop'), null);
  assert.equal(check('main', 'preview'), null);
});
test('work branches cannot bypass develop or preview', () => {
  assert.ok(check('preview', 'refactor/auth'));
  assert.ok(check('main', 'refactor/auth'));
  assert.ok(check('main', 'develop'));
});
test('stage branches cannot merge backwards into develop', () => {
  assert.ok(check('develop', 'main'));
  assert.ok(check('develop', 'preview'));
  assert.ok(check('develop', 'develop'));
});
test('a fork cannot impersonate a promotion branch', () => {
  assert.ok(check('preview', 'develop', 'contributor/SmartSpoon'));
  assert.ok(check('main', 'preview', 'contributor/SmartSpoon'));
  assert.ok(check('preview', 'develop', null));
});
test('unknown PR targets are rejected', () => {
  assert.ok(check('release', 'develop'));
});
