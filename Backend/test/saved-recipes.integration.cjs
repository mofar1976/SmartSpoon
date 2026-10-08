const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { getConnectionToken, getModelToken } = require('@nestjs/mongoose');
const uri = process.env.SAVED_RECIPES_TEST_MONGODB_URI;
if (!uri || !new URL(uri).pathname.startsWith('/smartspoon_saved_verification_'))
  throw new Error('Isolierte smartspoon_saved_verification_* Datenbank erforderlich.');
process.env.MONGODB_URI = uri;
process.env.JWT_SECRET = 'saved-tests-only-secret-more-than-32-characters';
const { AppModule } = require('../dist/app.module');
const { configureApplication } = require('../dist/config/application');
const { RECIPE_PROVIDER } = require('../dist/modules/ai/recipe-contract');
const { ProductSeedService } = require('../dist/modules/products/product-seed.service');
test('HTTP and MongoDB: explicit complete saving, concurrency, ownership, persistence and deletion', async () => {
  let app,
    aiCalls = 0;
  try {
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(RECIPE_PROVIDER)
      .useValue({
        generate: async (context) => {
          aiCalls++;
          const p = context.products[0];
          return {
            recipes: [
              {
                title: 'Testgericht',
                servings: 1,
                cookingTimeMinutes: 20,
                ingredients: [{ productId: p.id, quantity: 1200, unit: p.packageUnit }],
                steps: ['Zutaten garen.'],
              },
            ],
          };
        },
      })
      .compile();
    app = module.createNestApplication();
    app.useLogger(false);
    configureApplication(app);
    await app.listen(0, '127.0.0.1');
    const db = app.get(getConnectionToken()).db;
    await app.get(ProductSeedService).seed();
    await app.get(getModelToken('SavedRecipe')).init();
    const base = 'http://127.0.0.1:' + app.getHttpServer().address().port;
    const req = async (path, method = 'GET', body, token) => {
      const r = await fetch(base + '/api/' + path, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: 'Bearer ' + token } : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      return { status: r.status, body: r.status === 204 ? null : await r.json() };
    };
    const register = async (username) => {
      const r = await req('auth/register', 'POST', {
        username,
        password: 'Password123!',
        birthDate: '2000-01-01',
      });
      assert.equal(r.status, 201);
      return r.body.accessToken;
    };
    const alice = await register('saved_alice'),
      bob = await register('saved_bob'),
      before = await db.collection('users').findOne({ username: 'saved_alice' });
    const generated = await req(
      'recipes/generate',
      'POST',
      {
        supermarket: 'rewe',
        weeklyBudgetCents: 4000,
        persons: 1,
        lifeSituation: 'student',
        maxCookingTimeMinutes: 30,
        recipeCount: 1,
      },
      alice,
    );
    assert.equal(generated.status, 200);
    assert.equal(await db.collection('saved_recipes').countDocuments(), 0);
    const input = {
      result: generated.body,
      title: 'Mein Einkauf',
      checkedProductIds: [generated.body.shoppingList[0].product.id],
    };
    for (const [body, token, status] of [
      [input, null, 401],
      [input, bob, 400],
      [{ ...input, userId: 'injected' }, alice, 400],
      [{ ...input, result: { ...generated.body, totalCostCents: 1 } }, alice, 400],
      [{ ...input, title: '   ' }, alice, 400],
      [{ ...input, checkedProductIds: ['f'.repeat(24)] }, alice, 400],
      [
        { ...input, checkedProductIds: [input.checkedProductIds[0], input.checkedProductIds[0]] },
        alice,
        400,
      ],
    ])
      assert.equal((await req('saved-recipes', 'POST', body, token)).status, status);
    const saved = await req('saved-recipes', 'POST', input, alice);
    assert.equal(saved.status, 201);
    const id = saved.body.id,
      { saveProof, ...snapshot } = generated.body;
    assert.deepEqual(saved.body.result, snapshot);
    assert.deepEqual(saved.body.checkedProductIds, input.checkedProductIds);
    const repeated = await Promise.all(
      Array.from({ length: 4 }, () => req('saved-recipes', 'POST', input, alice)),
    );
    assert.ok(repeated.every((r) => r.body.id === id));
    assert.equal(await db.collection('saved_recipes').countDocuments(), 1);
    for (const method of ['GET', 'DELETE'])
      assert.equal((await req('saved-recipes/' + id, method, undefined, bob)).status, 404);
    assert.equal((await req('saved-recipes', 'GET', undefined, bob)).body.total, 0);
    for (const path of [
      'saved-recipes?limit=0',
      'saved-recipes/not-valid',
      'saved-recipes?offset=1.5',
    ])
      assert.equal((await req(path, 'GET', undefined, alice)).status, 400);
    const list = await req('saved-recipes?limit=1&offset=0', 'GET', undefined, alice);
    assert.equal(list.body.total, 1);
    assert.equal(list.body.items[0].title, 'Mein Einkauf');
    assert.equal(list.body.items[0].result, undefined);
    await db.collection('products').deleteMany({});
    assert.deepEqual(
      (await req('saved-recipes/' + id, 'GET', undefined, alice)).body.result,
      snapshot,
    );
    const connection = await require('mongoose').createConnection(uri).asPromise();
    try {
      assert.deepEqual(
        (await connection.db.collection('saved_recipes').findOne({})).result,
        snapshot,
      );
    } finally {
      await connection.close();
    }
    assert.deepEqual(await db.collection('users').findOne({ username: 'saved_alice' }), before);
    assert.equal(aiCalls, 1);
    const spec = (await req('docs-json')).body;
    assert.ok(spec.paths['/api/saved-recipes']);
    assert.ok(spec.components.schemas.SavedRecipeResponseDto);
    assert.equal((await req('saved-recipes/' + id, 'DELETE', undefined, alice)).status, 204);
    assert.equal((await req('saved-recipes/' + id, 'GET', undefined, alice)).status, 404);
  } finally {
    if (app) {
      await app.get(getConnectionToken()).dropDatabase();
      await app.close();
    }
  }
});
