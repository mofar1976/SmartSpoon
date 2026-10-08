const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const base = process.env.PRODUCTS_TEST_URL;
if (!base) throw new Error('PRODUCTS_TEST_URL muss auf einen isolierten, mit Testprodukten befüllten Stack zeigen.');

async function request(path, token) {
  const response = await fetch(base + path, { headers: token ? { Authorization: 'Bearer ' + token } : {} });
  return { status: response.status, body: await response.json() };
}

test('product catalog authentication, filtering, pagination and lookup against MongoDB', async () => {
  assert.equal((await request('/api/products')).status, 401);
  assert.equal((await request('/api/products/supermarkets')).status, 401);
  const response = await fetch(base + '/api/auth/register', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'catalog_' + randomBytes(5).toString('hex'), password: 'TestPasswort123!', birthDate: '2000-05-15' }),
  });
  assert.equal(response.status, 201);
  const { accessToken } = await response.json();
  const markets = await request('/api/products/supermarkets', accessToken);
  assert.equal(markets.status, 200);
  assert.deepEqual(markets.body.map(m => m.id), ['rewe', 'aldi', 'lidl']);
  const all = await request('/api/products', accessToken);
  assert.equal(all.status, 200);
  assert.equal(all.body.total, 36);
  assert.equal(all.body.items.length, 36);
  assert.match(all.body.priceNotice, /Fiktive Testpreise/);
  for (const market of ['rewe', 'aldi', 'lidl']) {
    const filtered = await request('/api/products?supermarket=' + market, accessToken);
    assert.equal(filtered.status, 200);
    assert.equal(filtered.body.total, 12);
    assert.ok(filtered.body.items.every(p => p.supermarket === market));
  }
  const page = await request('/api/products?supermarket=rewe&limit=3&offset=2', accessToken);
  assert.equal(page.body.total, 12);
  assert.equal(page.body.items.length, 3);
  const first = page.body.items[0];
  assert.ok(Number.isInteger(first.priceCents) && first.priceCents > 0);
  assert.equal(first.priceType, 'test');
  assert.equal(first.observedAt, null);
  assert.equal(first.location, null);
  assert.equal(first.sourceUrl, null);
  assert.ok(!('_id' in first) && !('__v' in first));
  const detail = await request('/api/products/' + first.id, accessToken);
  assert.equal(detail.status, 200);
  assert.deepEqual(detail.body, first);
  assert.equal((await request('/api/products/' + first.id)).status, 401);
  assert.equal((await request('/api/products/not-an-id', accessToken)).status, 400);
  assert.equal((await request('/api/products/000000000000000000000001', accessToken)).status, 404);
  const pastEnd = await request('/api/products?offset=100', accessToken);
  assert.equal(pastEnd.body.total, 36);
  assert.deepEqual(pastEnd.body.items, []);
  for (const query of ['supermarket=unknown', 'supermarket[$ne]=x', 'limit=0', 'limit=101', 'limit=', 'limit=1.5', 'limit=1&limit=2', 'offset=-1', 'unexpected=1']) {
    assert.equal((await request('/api/products?' + query, accessToken)).status, 400, query);
  }
  const docs = await request('/api/docs-json');
  assert.ok(docs.body.paths['/api/products']);
  assert.ok(docs.body.components.schemas.ProductResponseDto);
});
