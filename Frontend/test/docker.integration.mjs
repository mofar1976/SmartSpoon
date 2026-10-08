import test from 'node:test';
import assert from 'node:assert/strict';

const base = process.env.FRONTEND_TEST_URL ?? 'http://127.0.0.1:8080';
const get = (path) => fetch(new URL(path, base), { signal: AbortSignal.timeout(10000) });

test('Angular routes load the production index without caching it', async () => {
  const home = await get('/');
  assert.equal(home.status, 200);
  const html = await home.text();
  assert.match(html, /<app-root/);
  for (const path of ['/anmelden', '/registrieren', '/rezepte', '/gespeichert', '/gespeichert/' + '1'.repeat(24), '/unknown-route']) {
    const response = await get(path);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /text\/html/);
    assert.equal(response.headers.get('cache-control'), 'no-cache');
    assert.equal(await response.text(), html);
  }
});

test('fingerprinted assets are cached and missing assets return 404', async () => {
  const html = await (await get('/')).text();
  const asset = html.match(/src="(main-[^"]+\.js)"/)?.[1];
  assert.ok(asset);
  const response = await get('/' + asset);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /javascript/);
  assert.match(response.headers.get('cache-control'), /immutable/);
  assert.equal((await get('/missing-file.js')).status, 404);
});

test('proxy preserves backend readiness, authentication and API errors', async () => {
  assert.equal((await get('/healthz')).status, 200);
  const ready = await get('/api/health/ready');
  assert.equal(ready.status, 200);
  assert.deepEqual(await ready.json(), { status: 'ok', database: 'up' });
  for (const [path, status] of [
    ['/api/auth/me', 401],
    ['/api/products/supermarkets', 401],
    ['/api/does-not-exist', 404],
    ['/api', 404],
  ]) {
    const response = await get(path);
    assert.equal(response.status, status);
    assert.match(response.headers.get('content-type'), /application\/json/);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal((await response.json()).statusCode, status);
  }
  const invalid = await fetch(new URL('/api/auth/login', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(invalid.status, 400);
});

test('Swagger and OpenAPI remain available through the proxy', async () => {
  assert.equal((await get('/api/docs')).status, 200);
  const spec = await (await get('/api/docs-json')).json();
  assert.ok(spec.paths['/api/recipes/generate']);
});
