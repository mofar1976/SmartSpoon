const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { randomBytes } = require('node:crypto');
const { Test } = require('@nestjs/testing');
const { ConfigService } = require('@nestjs/config');
const { GoogleGenAI } = require('@google/genai');
const { getConnectionToken } = require('@nestjs/mongoose');
const { ThrottlerStorage } = require('@nestjs/throttler');
const uri = process.env.RECIPES_TEST_MONGODB_URI;
if (!uri) throw new Error('RECIPES_TEST_MONGODB_URI muss auf eine isolierte Testdatenbank zeigen.');
process.env.MONGODB_URI = uri;
process.env.GEMINI_API_KEY = 'integration-only-not-a-real-key';
const { AppModule } = require('../dist/app.module');
const { configureApplication } = require('../dist/config/application');
const { GEMINI_CLIENT } = require('../dist/modules/ai/gemini.provider');
const { ProductSeedService } = require('../dist/modules/products/product-seed.service');
const { TEST_PRODUCTS } = require('../dist/modules/products/data/test-products');

function listen(server) { return new Promise(resolve => server.listen(0, '127.0.0.1', resolve)); }

test('HTTP recipe generation with real MongoDB and the actual Gemini SDK against a local mock', async () => {
  let mode = 'valid';
  const contexts = [];
  const mockServer = createServer(async (req, res) => {
    try {
      let text = '';
      for await (const chunk of req) text += chunk;
      const body = JSON.parse(text);
      assert.match(req.url, /:generateContent/);
      assert.equal(body.generationConfig.responseMimeType, 'application/json');
      assert.equal(body.generationConfig.responseJsonSchema, undefined);
      assert.ok(body.generationConfig.responseSchema.properties.recipes);
      const context = JSON.parse(body.contents[0].parts[0].text);
      contexts.push(context);
      res.setHeader('Content-Type', 'application/json');
      if (mode === 'quota') { res.writeHead(429); return res.end(JSON.stringify({ error: { code: 429, message: 'secret provider details', status: 'RESOURCE_EXHAUSTED' } })); }
      const product = context.products.find(p => p.ingredientKey === 'rice') ?? context.products[0];
      const recipes = Array.from({ length: context.preferences.recipeCount }, (_, i) => ({
        title: 'Testrezept ' + (i + 1), servings: context.preferences.persons, cookingTimeMinutes: 20,
        ingredients: [{ productId: product.id, quantity: 600, unit: product.packageUnit }], steps: ['Zutaten in Wasser garen.'],
      }));
      if (mode === 'unknown' || (mode === 'correction' && !context.correction)) recipes[0].ingredients[0].productId = 'f'.repeat(24);
      if (mode === 'over-budget') recipes[0].ingredients[0].quantity = 100000;
      const reply = mode === 'malformed' ? '{' : JSON.stringify({ recipes });
      res.end(JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text: reply }] }, finishReason: 'STOP' }] }));
    } catch (error) { res.writeHead(500); res.end(JSON.stringify({ error: { message: 'Mock assertion failed' } })); }
  });
  let app;
  await listen(mockServer);
  try {
    const client = new GoogleGenAI({ apiKey: 'integration-only-not-a-real-key', httpOptions: { baseUrl: 'http://127.0.0.1:' + mockServer.address().port } });
    const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(GEMINI_CLIENT).useValue(client).compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const base = 'http://127.0.0.1:' + app.getHttpServer().address().port;
    const storage = app.get(ThrottlerStorage);
    const resetThrottle = () => storage.onApplicationShutdown();
    const preferences = { supermarket: 'rewe', weeklyBudgetCents: 4000, persons: 2, lifeSituation: 'student', diet: 'vegan', allergies: ['gluten'], excludedIngredients: [], maxCookingTimeMinutes: 30, recipeCount: 2 };
    const registration = { username: 'recipe_' + randomBytes(5).toString('hex'), password: 'TestPasswort123!', birthDate: '2000-05-15' };
    const registered = await fetch(base + '/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(registration) });
    assert.equal(registered.status, 201);
    const token = (await registered.json()).accessToken;
    const post = async (body = preferences, accessToken = token) => {
      const response = await fetch(base + '/api/recipes/generate', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: 'Bearer ' + accessToken } : {}) }, body: JSON.stringify(body) });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await post(preferences, null)).status, 401);
    assert.equal((await post({ ...preferences, userId: 'someone-else' })).status, 400);
    assert.equal((await post({ ...preferences, weeklyBudgetCents: '4000' })).status, 400);
    assert.equal((await post()).status, 422);
    assert.equal(contexts.length, 0);
    resetThrottle();

    // Simulate old fixtures: the metadata migration must preserve an existing price.
    const db = app.get(getConnectionToken()).db;
    const old = { ...TEST_PRODUCTS[0], priceCents: 321 };
    delete old.ingredientKey; delete old.dietaryTags; delete old.allergens;
    await db.collection('products').insertOne(old);
    const seeded = await app.get(ProductSeedService).seed();
    assert.equal(seeded.inserted, 35);
    assert.equal(seeded.metadataFieldsAdded, 3);
    const seededAgain = await app.get(ProductSeedService).seed();
    assert.equal(seededAgain.inserted, 0);
    assert.equal(seededAgain.metadataFieldsAdded, 0);
    const preserved = await db.collection('products').findOne({ sku: old.sku });
    assert.equal(preserved.priceCents, 321);
    assert.equal(preserved.ingredientKey, 'rice');
    const userBefore = await db.collection('users').findOne({ username: registration.username });

    const result = await post();
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(result.body.recipes.length, 2);
    assert.equal(result.body.totalCostCents, 642);
    assert.equal(result.body.shoppingList[0].packs, 2);
    assert.equal(result.body.shoppingList[0].neededQuantity, 1200);
    assert.equal(result.body.shoppingList[0].leftoverQuantity, 800);
    assert.equal(result.body.priceType, 'test');
    const firstContext = contexts.at(-1);
    assert.ok(Number.isInteger(firstContext.age));
    assert.ok(!JSON.stringify(firstContext).includes(registration.birthDate));
    assert.ok(!JSON.stringify(firstContext).includes(registration.username));
    assert.ok(firstContext.products.every(p => p.dietaryTags.includes('vegan') && !p.allergens.includes('gluten')));
    assert.deepEqual(await db.collection('users').findOne({ username: registration.username }), userBefore);

    const excluded = await post({ ...preferences, excludedIngredients: ['rice'] });
    assert.equal(excluded.status, 200);
    assert.ok(contexts.at(-1).products.every(p => p.ingredientKey !== 'rice'));
    mode = 'correction';
    const callsBefore = contexts.length;
    assert.equal((await post()).status, 200);
    assert.equal(contexts.length - callsBefore, 2);
    assert.ok(contexts.at(-1).correction);
    resetThrottle();

    for (const [failure, code] of [['unknown', 422], ['over-budget', 422], ['malformed', 502], ['quota', 503]]) {
      mode = failure;
      const failed = await post();
      assert.equal(failed.status, code, JSON.stringify(failed.body));
      assert.ok(!JSON.stringify(failed.body).includes('secret provider details'));
    }
    resetThrottle();
    app.get(ConfigService).set('GEMINI_API_KEY', '');
    assert.equal((await post()).status, 503);
    app.get(ConfigService).set('GEMINI_API_KEY', 'integration-only-not-a-real-key');
    resetThrottle();
    for (let i = 0; i < 5; i++) assert.equal((await post({ ...preferences, weeklyBudgetCents: 1 })).status, 422);
    assert.equal((await post({ ...preferences, weeklyBudgetCents: 1 })).status, 429);
    const spec = await (await fetch(base + '/api/docs-json')).json();
    assert.ok(spec.paths['/api/recipes/generate']);
    assert.ok(spec.components.schemas.RecipeGenerationResponseDto);
  } finally {
    if (app) await app.close();
    await new Promise(resolve => mockServer.close(resolve));
  }
});
