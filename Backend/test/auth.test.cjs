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


test('login rejects MongoDB operator credentials before querying', async () => {
  const { AuthService } = require('../dist/modules/auth/auth.service');
  const service = new AuthService(new Proxy({}, { get() { throw new Error('Database must not be queried'); } }), {}, {});
  for (const credentials of [
    { username: { $ne: null }, password: 'password' },
    { username: ['demo'], password: 'password' },
    { username: 'demo', password: { $ne: null } },
  ]) await assert.rejects(service.login(credentials), e => e.getStatus() === 401);
});
