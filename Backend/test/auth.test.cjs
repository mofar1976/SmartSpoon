const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PasswordService } = require('../dist/modules/auth/password.service');
const { validateEnvironment } = require('../dist/config/environment');

test('password hashes use unique salts and verify only the correct password', async () => {
  const passwords = new PasswordService();
  const first = await passwords.hash('MeinPasswort123!');
  const second = await passwords.hash('MeinPasswort123!');
  assert.notEqual(first, second);
  assert.ok(!first.includes('MeinPasswort123!'));
  assert.equal(await passwords.verify('MeinPasswort123!', first), true);
  assert.equal(await passwords.verify('falschesPasswort', first), false);
  assert.equal(await passwords.verify('MeinPasswort123!', 'broken'), false);
});

test('startup rejects missing or short JWT secrets', () => {
  for (const secret of [undefined, '', 'short']) {
    assert.throws(() => validateEnvironment({ MONGODB_URI: 'mongodb://localhost/db', JWT_SECRET: secret }), /JWT_SECRET/);
  }
});
