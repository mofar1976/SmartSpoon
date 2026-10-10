require('reflect-metadata');
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { Test } = require('@nestjs/testing');
const { GoogleGenAI } = require('@google/genai');
const { getConnectionToken } = require('@nestjs/mongoose');
const { ThrottlerStorage } = require('@nestjs/throttler');
const uri = process.env.PANTRY_TEST_MONGODB_URI;
if (!uri || !new URL(uri).pathname.startsWith('/smartspoon_pantry_test_'))
  throw new Error(
    'PANTRY_TEST_MONGODB_URI muss auf eine isolierte smartspoon_pantry_test_-Datenbank zeigen.',
  );
process.env.MONGODB_URI = uri;
process.env.JWT_SECRET = 'pantry-tests-only-secret-more-than-32-characters';
process.env.GEMINI_API_KEY = 'pantry-mock-only';
const { AppModule } = require('../dist/app.module');
const { configureApplication } = require('../dist/config/application');
const { GEMINI_CLIENT } = require('../dist/modules/ai/gemini.provider');

test('pantry HTTP generation with real JWT/Mongo and actual Gemini SDK against a local mock', async () => {
  let mode = 'valid';
  const contexts = [];
  const mock = createServer(async (req, res) => {
    let data = '';
    for await (const chunk of req) data += chunk;
    const body = JSON.parse(data);
    assert.equal(body.generationConfig.responseMimeType, 'application/json');
    assert.ok(
      body.contents.every((content) =>
        content.parts.every((part) => typeof part.text === 'string' && !part.inlineData),
      ),
    );
    const context = JSON.parse(body.contents[0].parts[0].text);
    contexts.push(context);
    if (mode === 'quota') {
      res.writeHead(429);
      return res.end(
        JSON.stringify({
          error: { code: 429, message: 'internal secret', status: 'RESOURCE_EXHAUSTED' },
        }),
      );
    }
    const ingredient = context.ingredients[0];
    const recipes = Array.from({ length: context.preferences.recipeCount }, () => ({
      title: 'Bananenreis',
      servings: context.preferences.persons,
      cookingTimeMinutes: 20,
      ingredients: [
        { ingredientId: ingredient.id, name: ingredient.name, quantity: 2, unit: 'piece' },
      ],
      steps: ['Banane schneiden.'],
    }));
    if (context.preferences.allowAdditionalIngredients || mode === 'extra')
      recipes[0].ingredients.push({
        ingredientId: null,
        name: 'Haferflocken',
        quantity: 50,
        unit: 'g',
      });
    if (mode === 'correction' && !context.correction) recipes[0].ingredients[0].quantity = 99;
    if (mode === 'quantity') recipes[0].ingredients[0].quantity = 99;
    const text = mode === 'malformed' ? '{' : JSON.stringify({ recipes });
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        candidates: [{ content: { role: 'model', parts: [{ text }] }, finishReason: 'STOP' }],
      }),
    );
  });
  await new Promise((resolve) => mock.listen(0, '127.0.0.1', resolve));
  let app;
  try {
    const client = new GoogleGenAI({
      apiKey: 'mock-only',
      httpOptions: { baseUrl: 'http://127.0.0.1:' + mock.address().port },
    });
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GEMINI_CLIENT)
      .useValue(client)
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const base = 'http://127.0.0.1:' + app.getHttpServer().address().port;
    const registration = await fetch(base + '/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'pantry_test',
        password: 'TestPasswort123!',
        birthDate: '2000-01-01',
      }),
    });
    assert.equal(registration.status, 201);
    const token = (await registration.json()).accessToken;
    const preferences = {
      ingredientsConfirmed: true,
      ingredients: [{ name: 'Banane', quantity: 3, unit: 'piece' }],
      persons: 2,
      maxCookingTimeMinutes: 30,
      recipeCount: 2,
      diet: 'vegan',
      allergies: ['milk'],
    };
    const post = async (body = preferences, auth = token) => {
      app.get(ThrottlerStorage).onApplicationShutdown();
      const response = await fetch(base + '/api/pantry-recipes/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(auth ? { Authorization: 'Bearer ' + auth } : {}),
        },
        body: JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() };
    };
    assert.equal((await post(preferences, null)).status, 401);
    assert.equal((await post({ ...preferences, ingredientsConfirmed: false })).status, 400);
    assert.equal((await post({ ...preferences, image: 'bytes' })).status, 400);
    assert.equal(
      (await post({ ...preferences, ingredients: [{ name: 'Banane', quantity: 3 }] })).status,
      400,
    );
    assert.equal(contexts.length, 0);
    const result = await post();
    assert.equal(result.status, 200);
    assert.equal(result.body.recipes.length, 2);
    assert.equal(result.body.requiresIngredientReview, true);
    assert.equal(typeof result.body.saveProof, 'string');
    assert.equal(contexts[0].preferences.diet, 'vegan');
    assert.deepEqual(contexts[0].preferences.allergies, ['milk']);
    assert.equal(typeof contexts[0].age, 'number');
    const added = await post({ ...preferences, allowAdditionalIngredients: true });
    assert.equal(added.status, 200);
    assert.deepEqual(added.body.recipes[0].shoppingList, [
      { id: 'recipe-1-item-1', name: 'Haferflocken', quantity: 50, unit: 'g' },
    ]);
    mode = 'extra';
    assert.equal((await post()).status, 422);
    mode = 'quantity';
    assert.equal((await post()).status, 422);
    mode = 'correction';
    assert.equal((await post()).status, 200);
    assert.ok(contexts.at(-1).correction);
    mode = 'malformed';
    assert.equal((await post()).status, 502);
    mode = 'quota';
    const unavailable = await post();
    assert.equal(unavailable.status, 503);
    assert.ok(!JSON.stringify(unavailable.body).includes('internal secret'));
  } finally {
    if (app) {
      await app.get(getConnectionToken()).dropDatabase();
      await app.close();
    }
    mock.closeAllConnections();
    await new Promise((resolve) => mock.close(resolve));
  }
});
