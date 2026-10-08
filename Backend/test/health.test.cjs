const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HealthService } = require('../dist/modules/health/health.service');
const { validateEnvironment } = require('../dist/config/environment');

function unavailable(error) {
  assert.equal(error.getStatus(), 503);
  assert.deepEqual(error.getResponse(), { status: 'error', database: 'down' });
  return true;
}

test('readiness pings the database with a bounded timeout', async () => {
  const service = new HealthService({ readyState: 1, db: {
    command: async (command, options) => {
      assert.deepEqual(command, { ping: 1 });
      assert.equal(options.timeoutMS, 2000);
    },
  } });
  assert.deepEqual(await service.readiness(), { status: 'ok', database: 'up' });
});

test('disconnected database returns 503 without running a query', async () => {
  const service = new HealthService({ readyState: 0, db: {
    command: () => assert.fail('must not query a disconnected database'),
  } });
  await assert.rejects(service.readiness(), unavailable);
});

test('failed ping returns 503 without exposing connection details', async () => {
  const service = new HealthService({ readyState: 1, db: {
    command: async () => { throw new Error('mongodb://secret@example'); },
  } });
  await assert.rejects(service.readiness(), unavailable);
});

test('configuration accepts a local MongoDB URI and converts the port', () => {
  const config = validateEnvironment({ MONGODB_URI: 'mongodb://127.0.0.1:27017/smartspoon', PORT: '3001', JWT_SECRET: 'x'.repeat(32) });
  assert.equal(config.PORT, 3001);
});

test('configuration rejects missing database URI and invalid ports', () => {
  assert.throws(() => validateEnvironment({}), /MONGODB_URI/);
  for (const port of ['abc', '', '0', '65536', '3.5']) {
    assert.throws(() => validateEnvironment({ MONGODB_URI: 'mongodb://localhost/db', PORT: port }), /PORT/);
  }
});
