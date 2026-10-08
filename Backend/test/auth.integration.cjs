const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const { JwtService } = require('@nestjs/jwt');
const { readFileSync } = require('node:fs');
const base = process.env.AUTH_TEST_URL;
if (!base) throw new Error('AUTH_TEST_URL muss auf einen isolierten Teststack zeigen.');
const username = 'test_' + randomBytes(6).toString('hex');
const credentials = { username, password: 'MeinPasswort123!' };
async function request(path, body, token) {
  const response = await fetch(base + '/api/auth/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return { status: response.status, body: await response.json() };
}

test('registration, login, validation and token protection against real MongoDB', async () => {
  assert.equal((await request('register', { username: 'x', password: 'short' })).status, 400);
  assert.equal((await request('register', { ...credentials, role: 'admin' })).status, 400);
  assert.equal((await request('register', { username: { $ne: null }, password: credentials.password })).status, 400);
  assert.equal((await request('register', credentials)).status, 400);
  for (const birthDate of ['2001-02-29', '2000-02-30', '2999-01-01', '15.05.2000', '2000-05-15T00:00:00Z', null]) {
    assert.equal((await request('register', { ...credentials, birthDate })).status, 400);
  }
  const registration = { ...credentials, birthDate: '2000-05-15' };
  const registrations = await Promise.all([
    request('register', { ...registration, username: ' ' + username.toUpperCase() + ' ' }),
    request('register', registration),
  ]);
  assert.deepEqual(registrations.map(r => r.status).sort(), [201, 409]);
  const registered = registrations.find(r => r.status === 201).body;
  assert.deepEqual(Object.keys(registered.user).sort(), ['birthDate', 'id', 'username']);
  assert.equal(registered.user.username, username);
  assert.equal(registered.user.birthDate, '2000-05-15');
  assert.equal(registered.expiresIn, 3600);
  const login = await request('login', { ...credentials, username: username.toUpperCase() });
  assert.equal(login.status, 200);
  assert.deepEqual(login.body.user, registered.user);
  const me = await request('me', undefined, login.body.accessToken);
  assert.equal(me.status, 200);
  assert.deepEqual(me.body, registered.user);
  const wrong = await request('login', { ...credentials, password: 'WrongPassword!' });
  const unknown = await request('login', { ...credentials, username: 'unknown_' + randomBytes(4).toString('hex') });
  assert.equal(wrong.status, 401);
  assert.equal(unknown.status, 401);
  assert.equal(wrong.body.message, unknown.body.message);
  assert.equal((await request('me')).status, 401);
  assert.equal((await request('me', undefined, 'broken')).status, 401);
  const jwt = new JwtService();
  const secret = readFileSync('.env', 'utf8').split('\n').find(line => line.startsWith('JWT_SECRET=')).slice('JWT_SECRET='.length);
  for (const options of [
    { secret, expiresIn: -1, issuer: 'smartspoon', audience: 'smartspoon-api' },
    { secret: 'wrong-secret', expiresIn: 60, issuer: 'smartspoon', audience: 'smartspoon-api' },
    { secret, expiresIn: 60, issuer: 'wrong', audience: 'smartspoon-api' },
  ]) {
    const token = await jwt.signAsync({ sub: registered.user.id }, options);
    assert.equal((await request('me', undefined, token)).status, 401);
  }
  let limited = false;
  for (let i = 0; i < 25; i++) {
    if ((await request('login', { username: 'x', password: 'short' })).status === 429) { limited = true; break; }
  }
  assert.ok(limited, 'Login requests should be rate limited');
});
