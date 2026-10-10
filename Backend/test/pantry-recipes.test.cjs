const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plainToInstance } = require('class-transformer');
const { validateSync } = require('class-validator');
const { ConfigService } = require('@nestjs/config');
const {
  PantryRecipesService: PantryService,
} = require('../dist/modules/pantry-recipes/pantry-recipes.service');
const { SnapshotProofService } = require('../dist/modules/saved-recipes/snapshot-proof.service');
const { JwtService } = require('@nestjs/jwt');
const proofs = new SnapshotProofService(
  new JwtService({ secret: 'pantry-unit-test-only-secret-more-than-32-characters' }),
);
class PantryRecipesService extends PantryService {
  constructor(ai) {
    super(ai, proofs);
  }
  generate(request, birthDate) {
    return super.generate(request, birthDate, '1'.repeat(24));
  }
}
const {
  GeneratePantryRecipesDto,
} = require('../dist/modules/pantry-recipes/dto/generate-pantry-recipes.dto');
const { GeminiPantryProvider } = require('../dist/modules/ai/gemini-pantry.provider');
const request = (extra = {}) =>
  plainToInstance(GeneratePantryRecipesDto, {
    ingredientsConfirmed: true,
    ingredients: [{ name: 'Banane', quantity: 3, unit: 'piece' }],
    persons: 2,
    maxCookingTimeMinutes: 30,
    recipeCount: 1,
    ...extra,
  });
const batch = () => ({
  recipes: [
    {
      title: 'Bananenscheiben',
      servings: 2,
      cookingTimeMinutes: 5,
      ingredients: [{ ingredientId: 'ingredient-1', name: 'Banane', quantity: 2, unit: 'piece' }],
      steps: ['Bananen schneiden.'],
    },
  ],
});
const errors = (value) =>
  validateSync(request(value), { whitelist: true, forbidNonWhitelisted: true });

test('pantry request requires confirmation and rejects unbounded, partial or foreign inputs', () => {
  assert.equal(errors({}).length, 0);
  for (const invalid of [
    { ingredientsConfirmed: false },
    { ingredientsConfirmed: undefined },
    { ingredients: [] },
    { ingredients: [{ name: '   ' }] },
    { ingredients: [{ name: 'Banane', quantity: 2 }] },
    { ingredients: [{ name: 'Banane', unit: 'piece' }] },
    { ingredients: [{ name: 'Banane', quantity: '2', unit: 'piece' }] },
    { ingredients: [{ name: 'Banane', quantity: null, unit: null }] },
    { ingredients: [{ name: 'Banane', ingredientId: 'user-id' }] },
    { ingredients: Array.from({ length: 41 }, () => ({ name: 'Banane' })) },
    { recipeCount: 8 },
    { persons: 0 },
    { maxCookingTimeMinutes: 200 },
    { allergies: ['unknown'] },
    { allowAdditionalIngredients: 'true' },
    { birthDate: '2000-01-01' },
    { image: 'base64' },
  ])
    assert.ok(errors(invalid).length > 0, JSON.stringify(invalid));
});

test('recipes use canonical names, independent available quantities, no prices and mandatory review', async () => {
  const proposal = batch();
  proposal.recipes[0].ingredients[0].name = 'invented name';
  proposal.recipes.push(structuredClone(proposal.recipes[0]));
  const contexts = [];
  const result = await new PantryRecipesService({
    generate: async (context) => {
      contexts.push(context);
      return proposal;
    },
  }).generate(request({ recipeCount: 2 }), '2000-01-01');
  assert.equal(result.mode, 'pantry');
  assert.equal(result.requiresIngredientReview, true);
  assert.equal(result.recipes[0].ingredients[0].name, 'Banane');
  assert.equal(result.recipes[0].ingredients[0].source, 'available');
  assert.deepEqual(result.recipes[0].shoppingList, []);
  assert.equal(result.totalCostCents, undefined);
  assert.equal(contexts[0].ingredients[0].id, 'ingredient-1');
  assert.equal(typeof contexts[0].age, 'number');
  assert.equal(contexts[0].preferences.ingredients, undefined);
});

test('additional ingredients require opt-in and appear in the selected recipe shopping list', async () => {
  const proposal = batch();
  proposal.recipes[0].ingredients.push({
    ingredientId: null,
    name: 'Haferflocken',
    quantity: 50,
    unit: 'g',
  });
  const service = new PantryRecipesService({ generate: async () => proposal });
  await assert.rejects(service.generate(request(), null), (e) => e.getStatus() === 422);
  const result = await service.generate(request({ allowAdditionalIngredients: true }), null);
  assert.deepEqual(result.recipes[0].shoppingList, [
    { id: 'recipe-1-item-1', name: 'Haferflocken', quantity: 50, unit: 'g' },
  ]);
});

test('unknown IDs, unavailable quantities, duplicate ingredients, exclusions and wrong preferences are rejected', async () => {
  for (const mutate of [
    (p) => (p.recipes[0].ingredients[0].ingredientId = 'ingredient-99'),
    (p) => (p.recipes[0].ingredients[0].quantity = 4),
    (p) => (p.recipes[0].ingredients[0].unit = 'g'),
    (p) => p.recipes[0].ingredients.push(structuredClone(p.recipes[0].ingredients[0])),
    (p) => (p.recipes[0].servings = 3),
    (p) => (p.recipes[0].cookingTimeMinutes = 31),
    (p) => p.recipes.push(structuredClone(p.recipes[0])),
    (p) => (p.recipes[0].ingredients[0].ingredientId = null),
  ]) {
    const proposal = batch();
    mutate(proposal);
    await assert.rejects(
      new PantryRecipesService({ generate: async () => proposal }).generate(
        request({ allowAdditionalIngredients: true }),
        null,
      ),
      (e) => e.getStatus() === 422,
    );
  }
  await assert.rejects(
    new PantryRecipesService({ generate: async () => batch() }).generate(
      request({ excludedIngredients: [' banane '] }),
      null,
    ),
    (e) => e.getStatus() === 422,
  );
});

test('duplicate inputs fail before AI and one correction is allowed for a rejected proposal', async () => {
  let calls = 0;
  const service = new PantryRecipesService({
    generate: async (context) => {
      calls++;
      if (calls === 1) {
        const p = batch();
        p.recipes[0].servings = 3;
        return p;
      }
      assert.ok(context.correction);
      return batch();
    },
  });
  await assert.rejects(
    service.generate(request({ ingredients: [{ name: 'Banane' }, { name: ' BANANE ' }] }), null),
    (e) => e.getStatus() === 400,
  );
  assert.equal(calls, 0);
  await service.generate(request(), null);
  assert.equal(calls, 2);
});

test('empty and malformed pantry proposals are rejected without false price or allergy claims', async () => {
  for (const [proposal, status] of [
    [{ recipes: [] }, 422],
    [{ recipes: 'bad' }, 502],
    [{ ...batch(), totalCostCents: 1 }, 502],
  ]) {
    await assert.rejects(
      new PantryRecipesService({ generate: async () => proposal }).generate(request(), null),
      (e) => e.getStatus() === status,
    );
  }
});

test('Gemini pantry generation uses text-only structured input and bounded calls', async () => {
  const config = new ConfigService({
    GEMINI_API_KEY: 'test',
    GEMINI_MODEL: 'gemini-3.5-flash-lite',
  });
  const context = {
    preferences: request(),
    ingredients: [{ id: 'ingredient-1', name: 'Banane' }],
    age: null,
  };
  const provider = new GeminiPantryProvider(config, {
    models: {
      generateContent: async (input) => {
        assert.equal(typeof input.contents, 'string');
        assert.deepEqual(JSON.parse(input.contents), JSON.parse(JSON.stringify(context)));
        assert.equal(input.config.responseMimeType, 'application/json');
        assert.equal(input.config.httpOptions.timeout, 30000);
        assert.equal(input.config.httpOptions.retryOptions.attempts, 1);
        assert.equal(
          input.config.responseSchema.properties.recipes.items.properties.ingredients.items
            .properties.ingredientId.nullable,
          true,
        );
        return { text: JSON.stringify(batch()) };
      },
    },
  });
  assert.deepEqual(await provider.generate(context), batch());
  await assert.rejects(
    new GeminiPantryProvider(new ConfigService(), null).generate(context),
    (e) => e.getStatus() === 503,
  );
  for (const text of ['{', JSON.stringify({ recipes: [], prices: [] }), 'x'.repeat(100001)]) {
    await assert.rejects(
      new GeminiPantryProvider(config, {
        models: { generateContent: async () => ({ text }) },
      }).generate(context),
      (e) => e.getStatus() === 502,
    );
  }
  for (const [failure, status] of [
    [{ status: 429 }, 503],
    [{ status: 504 }, 504],
    [new Error('secret-key'), 502],
  ]) {
    await assert.rejects(
      new GeminiPantryProvider(config, {
        models: {
          generateContent: async () => {
            throw failure;
          },
        },
      }).generate(context),
      (e) => e.getStatus() === status && !JSON.stringify(e.getResponse()).includes('secret-key'),
    );
  }
});

 test('empty response gets one reassessment without relaxing user preferences', async () => {
  const contexts = [];
  const input = request();
  const result = await new PantryRecipesService({ generate: async context => {
    contexts.push(structuredClone(context));
    return contexts.length === 1 ? { recipes: [] } : batch();
  }}).generate(input, null);
  assert.equal(result.recipes.length, 1);
  assert.equal(contexts.length, 2);
  assert.ok(contexts[1].correction);
  assert.deepEqual(contexts[1].preferences, contexts[0].preferences);
  assert.deepEqual(contexts[1].ingredients, contexts[0].ingredients);
  assert.equal(contexts[1].preferences.allowAdditionalIngredients, false);
  let calls = 0;
  await assert.rejects(new PantryRecipesService({generate: async () => {
    calls++; return { recipes: [] };
  }}).generate(input, null), e => e.getStatus() === 422);
  assert.equal(calls, 2);
});
