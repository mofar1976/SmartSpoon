require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');
const { JwtService } = require('@nestjs/jwt');
const { ThrottlerModule, ThrottlerStorage } = require('@nestjs/throttler');
const { AuthGuard } = require('../dist/modules/auth/auth.guard');
const { AuthService } = require('../dist/modules/auth/auth.service');
const {
  IngredientRecognitionController,
} = require('../dist/modules/ingredient-recognition/ingredient-recognition.controller');
const {
  IngredientRecognitionService,
} = require('../dist/modules/ingredient-recognition/ingredient-recognition.service');
const { configureApplication } = require('../dist/config/application');
const { validateEnvironment } = require('../dist/config/environment');
const image = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jH1sAAAAASUVORK5CYII=',
  'base64',
);
const answer = {
  model: 'qwen3-vl:4b-instruct',
  requiresConfirmation: true,
  ingredients: [{ name: 'Banane', evidence: 'Gelbe Frucht' }],
  uncertainItems: [],
};

test('recognition configuration is optional but rejects external destinations and invalid tokens', () => {
  const base = { MONGODB_URI: 'mongodb://localhost/db', JWT_SECRET: 's'.repeat(32) };
  assert.equal(validateEnvironment(base).INGREDIENT_RECOGNITION_TOKEN, '');
  for (const config of [
    { INGREDIENT_RECOGNITION_URL: 'https://example.com' },
    { INGREDIENT_RECOGNITION_TOKEN: 'short' },
    { INGREDIENT_RECOGNITION_TIMEOUT_MS: 0 },
  ]) {
    assert.throws(() => validateEnvironment({ ...base, ...config }));
  }
});

test('authenticated multipart HTTP upload validates files and service replies, bounds failures and throttles', async () => {
  let mode = 'valid';
  let calls = 0;
  const mock = createServer(async (req, res) => {
    calls++;
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    assert.equal(req.url, '/recognize');
    assert.equal(req.headers.authorization, 'Bearer ' + 'internal'.repeat(5));
    assert.equal(req.headers['content-type'], 'image/png');
    assert.deepEqual(Buffer.concat(chunks), image);
    if (mode === 'timeout') return setTimeout(() => res.end('{}'), 250);
    res.setHeader('Content-Type', 'application/json');
    if (typeof mode === 'number') {
      res.statusCode = mode;
      return res.end('{"secret":"provider detail"}');
    }
    if (mode === 'oversized') return res.end(' '.repeat(70000));
    if (mode === 'invalid')
      return res.end(JSON.stringify({ ...answer, requiresConfirmation: false }));
    res.end(JSON.stringify({ ...answer, metrics: { privateInternalData: true } }));
  });
  await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve));
  const jwt = new JwtService({ secret: 's'.repeat(32) });
  const config = new ConfigService({
    INGREDIENT_RECOGNITION_URL: 'http://127.0.0.1:' + mock.address().port,
    INGREDIENT_RECOGNITION_TOKEN: 'internal'.repeat(5),
    INGREDIENT_RECOGNITION_TIMEOUT_MS: 100,
  });
  let app;
  try {
    const module = await Test.createTestingModule({
      imports: [ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }])],
      controllers: [IngredientRecognitionController],
      providers: [
        IngredientRecognitionService,
        AuthGuard,
        { provide: ConfigService, useValue: config },
        { provide: JwtService, useValue: jwt },
        {
          provide: AuthService,
          useValue: { findUser: async () => ({ id: 'owner', username: 'test', birthDate: null }) },
        },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const url =
      'http://127.0.0.1:' + app.getHttpServer().address().port + '/api/ingredient-recognition';
    const token = jwt.sign(
      { sub: 'owner' },
      { issuer: 'smartspoon', audience: 'smartspoon-api', expiresIn: '1h' },
    );
    const post = async ({
      data = image,
      mime = 'image/png',
      field = 'image',
      auth = token,
      reset = true,
      extra = false,
    } = {}) => {
      if (reset) app.get(ThrottlerStorage).onApplicationShutdown();
      const form = new FormData();
      if (data !== null) form.append(field, new Blob([data], { type: mime }), 'photo.png');
      if (extra) form.append('image', new Blob([image]), 'extra.png');
      const response = await fetch(url, {
        method: 'POST',
        headers: auth ? { Authorization: 'Bearer ' + auth } : {},
        body: form,
      });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await post({ auth: null })).status, 401);
    assert.equal((await post({ auth: 'invalid' })).status, 401);
    assert.equal(calls, 0);
    assert.equal((await post({ data: null })).status, 400);
    assert.equal((await post({ data: Buffer.from('fake'), mime: 'image/jpeg' })).status, 422);
    assert.equal((await post({ field: 'wrong' })).status, 400);
    assert.equal((await post({ extra: true })).status, 400);
    assert.equal((await post({ data: Buffer.alloc(10 * 1024 * 1024 + 1) })).status, 413);
    assert.equal(calls, 0);
    assert.deepEqual(await post({ mime: 'application/octet-stream' }), {
      status: 200,
      body: answer,
    });
    for (const [upstream, expected] of [
      [422, 422],
      [429, 429],
      [503, 503],
      [504, 504],
      [401, 503],
      ['invalid', 502],
      ['oversized', 502],
      ['timeout', 504],
    ]) {
      mode = upstream;
      const result = await post();
      assert.equal(result.status, expected);
      assert.ok(!JSON.stringify(result.body).includes('provider detail'));
    }
    mode = 'valid';
    for (let index = 0; index < 5; index++)
      assert.equal((await post({ reset: index === 0 })).status, 200);
    assert.equal((await post({ reset: false })).status, 429);
  } finally {
    if (app) await app.close();
    mock.closeAllConnections();
    await new Promise((resolve) => mock.close(resolve));
  }
});
