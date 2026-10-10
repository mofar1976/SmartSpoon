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
const { PANTRY_RECIPE_PROVIDER } = require('../dist/modules/ai/pantry-recipe-contract');
const { RECIPE_PROVIDER } = require('../dist/modules/ai/recipe-contract');
const { ProductSeedService } = require('../dist/modules/products/product-seed.service');
test('HTTP and MongoDB: explicit complete saving, concurrency, ownership, persistence and deletion', async () => {
  let app,
    aiCalls = 0,
    pantryCalls = 0;
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
      .overrideProvider(PANTRY_RECIPE_PROVIDER)
      .useValue({
        generate: async () => {
          pantryCalls++;
          return {
            recipes: [1, 2].map((index) => ({
              title: 'Vorratsgericht ' + index,
              servings: 1,
              cookingTimeMinutes: 10,
              ingredients: [
                { ingredientId: 'ingredient-1', name: 'Banane', quantity: 1, unit: 'piece' },
                { ingredientId: null, name: 'Haferflocken', quantity: 50, unit: 'g' },
              ],
              steps: ['Banane schneiden und mit Haferflocken servieren.'],
            })),
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
    assert.equal(saved.body.mode, 'market');
    assert.deepEqual(saved.body.checkedItemIds, []);
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
    // Missing new fields in legacy documents must not require a migration.
    await db
      .collection('saved_recipes')
      .updateOne(
        { _id: new (require('mongoose').Types.ObjectId)(id) },
        { $unset: { checkedItemIds: '' } },
      );
    const legacy = await req('saved-recipes/' + id, 'GET', undefined, alice);
    assert.equal(legacy.body.mode, 'market');
    assert.deepEqual(legacy.body.checkedItemIds, []);
    assert.deepEqual(legacy.body.result, snapshot);

    const pantryGenerated = await req(
      'pantry-recipes/generate',
      'POST',
      {
        ingredientsConfirmed: true,
        ingredients: [{ name: 'Banane', quantity: 2, unit: 'piece' }],
        persons: 1,
        maxCookingTimeMinutes: 30,
        recipeCount: 2,
        allowAdditionalIngredients: true,
      },
      alice,
    );
    assert.equal(pantryGenerated.status, 200);
    assert.equal(typeof pantryGenerated.body.saveProof, 'string');
    assert.equal(await db.collection('saved_recipes').countDocuments(), 1);
    assert.deepEqual(
      pantryGenerated.body.recipes.map((r) => r.shoppingList[0].id),
      ['recipe-1-item-1', 'recipe-2-item-1'],
    );
    const pantryInput = {
      result: pantryGenerated.body,
      title: 'Mein Vorrat',
      checkedItemIds: ['recipe-2-item-1'],
    };
    for (const [input, token, expected] of [
      [pantryInput, null, 401],
      [pantryInput, bob, 400],
      [{ ...pantryInput, checkedItemIds: ['recipe-1-item-2'] }, alice, 400],
      [{ ...pantryInput, checkedItemIds: ['recipe-2-item-1', 'recipe-2-item-1'] }, alice, 400],
      [{ ...pantryInput, checkedProductIds: ['f'.repeat(24)] }, alice, 400],
      [{ ...pantryInput, checkedItemIds: ['__proto__'] }, alice, 400],
      [{ ...pantryInput, result: { ...pantryGenerated.body, saveProof: undefined } }, alice, 400],
      [{ ...pantryInput, result: { ...pantryGenerated.body, mode: 'market' } }, alice, 400],
      [{ ...pantryInput, result: { ...pantryGenerated.body, totalCostCents: 0 } }, alice, 400],
      [{ result: generated.body, checkedItemIds: ['recipe-1-item-1'] }, alice, 400],
    ])
      assert.equal((await req('saved-recipes', 'POST', input, token)).status, expected);
    const altered = structuredClone(pantryInput);
    altered.result.recipes[0].shoppingList[0].quantity++;
    assert.equal((await req('saved-recipes', 'POST', altered, alice)).status, 400);
    const alteredId = structuredClone(pantryInput);
    alteredId.result.recipes[0].shoppingList[0].id = 'recipe-1-item-2';
    assert.equal((await req('saved-recipes', 'POST', alteredId, alice)).status, 400);
    const pantrySaved = await Promise.all(
      Array.from({ length: 4 }, () => req('saved-recipes', 'POST', pantryInput, alice)),
    );
    assert.ok(pantrySaved.every((r) => r.status === 201 && r.body.id === pantrySaved[0].body.id));
    const pantryId = pantrySaved[0].body.id;
    const { saveProof: pantryProof, ...pantrySnapshot } = pantryGenerated.body;
    assert.equal(pantrySaved[0].body.mode, 'pantry');
    assert.deepEqual(pantrySaved[0].body.result, pantrySnapshot);
    assert.deepEqual(pantrySaved[0].body.checkedItemIds, ['recipe-2-item-1']);
    assert.deepEqual(pantrySaved[0].body.checkedProductIds, []);
    const repeatedPantry = await req(
      'saved-recipes',
      'POST',
      { ...pantryInput, title: 'Changed', checkedItemIds: [] },
      alice,
    );
    assert.equal(repeatedPantry.body.title, 'Mein Vorrat');
    assert.deepEqual(repeatedPantry.body.checkedItemIds, ['recipe-2-item-1']);
    assert.equal(await db.collection('saved_recipes').countDocuments(), 2);
    const mixed = await req('saved-recipes?limit=2', 'GET', undefined, alice);
    assert.equal(mixed.body.total, 2);
    const pantrySummary = mixed.body.items.find((i) => i.mode === 'pantry');
    assert.equal(pantrySummary.totalCostCents, undefined);
    assert.equal(pantrySummary.currency, undefined);
    assert.equal(pantrySummary.priceType, undefined);
    assert.deepEqual(pantrySummary.recipeTitles, ['Vorratsgericht 1', 'Vorratsgericht 2']);
    assert.equal(
      mixed.body.items.find((i) => i.mode === 'market').totalCostCents,
      snapshot.totalCostCents,
    );
    assert.equal(
      (await req('saved-recipes?limit=1&offset=1', 'GET', undefined, alice)).body.items.length,
      1,
    );
    for (const method of ['GET', 'DELETE'])
      assert.equal((await req('saved-recipes/' + pantryId, method, undefined, bob)).status, 404);
    const persisted = await require('mongoose').createConnection(uri).asPromise();
    try {
      const stored = await persisted.db
        .collection('saved_recipes')
        .findOne({ _id: new (require('mongoose').Types.ObjectId)(pantryId) });
      assert.deepEqual(stored.result, pantrySnapshot);
      assert.deepEqual(stored.checkedItemIds, ['recipe-2-item-1']);
      assert.equal(JSON.stringify(stored).includes(pantryProof), false);
    } finally {
      await persisted.close();
    }
    assert.deepEqual(
      (await req('saved-recipes/' + pantryId, 'GET', undefined, alice)).body.result,
      pantrySnapshot,
    );
    assert.equal(pantryCalls, 1);
    assert.equal(aiCalls, 1);
    assert.deepEqual(await db.collection('users').findOne({ username: 'saved_alice' }), before);
    assert.equal(spec.components.schemas.SaveRecipesDto.properties.result.oneOf.length, 2);
    assert.equal(spec.components.schemas.SavedRecipeResponseDto.properties.result.oneOf.length, 2);
    assert.ok(spec.components.schemas.SavedPantryRecipeSnapshotDto);
    assert.equal((await req('saved-recipes/' + pantryId, 'DELETE', undefined, alice)).status, 204);
    assert.equal((await req('saved-recipes/' + pantryId, 'GET', undefined, alice)).status, 404);
    assert.equal((await req('saved-recipes/' + id, 'DELETE', undefined, alice)).status, 204);
    assert.equal((await req('saved-recipes/' + id, 'GET', undefined, alice)).status, 404);
  } finally {
    if (app) {
      await app.get(getConnectionToken()).dropDatabase();
      await app.close();
    }
  }
});
