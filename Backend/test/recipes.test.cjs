const { test } = require('node:test');
const assert = require('node:assert/strict');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { BudgetService } = require('../dist/modules/recipes/budget.service');
const { RecipesService } = require('../dist/modules/recipes/recipes.service');
const { ageFromBirthDate } = require('../dist/modules/recipes/age');
const { GenerateRecipesDto } = require('../dist/modules/recipes/dto/generate-recipes.dto');
const { recipeBatchSchema } = require('../dist/modules/ai/recipe-contract');
const { products, preferences, batch } = require('./recipe-fixtures.cjs');
const status = code => error => error.getStatus() === code;

test('shopping cost rounds up whole packs and includes leftovers', () => {
  const result = new BudgetService().evaluate(batch(products[0], 1200), products, preferences());
  assert.equal(result.totalCostCents, 498);
  assert.equal(result.shoppingList[0].packs, 2);
  assert.equal(result.shoppingList[0].leftoverQuantity, 800);
  assert.equal(result.remainingBudgetCents, 3502);
});

test('ingredients shared between recipes are combined before rounding packs', () => {
  const proposal = batch();
  proposal.recipes.push(structuredClone(proposal.recipes[0]));
  const input = preferences(); input.recipeCount = 2;
  const result = new BudgetService().evaluate(proposal, products, input);
  assert.equal(result.totalCostCents, 249);
  assert.equal(result.shoppingList.length, 1);
  assert.equal(result.shoppingList[0].neededQuantity, 800);
});

test('budget validation rejects unknown products, wrong units, duplicates, portions and cooking time', () => {
  const budget = new BudgetService();
  for (const change of [
    b => { b.recipes[0].ingredients[0].productId = 'f'.repeat(24); },
    b => { b.recipes[0].ingredients[0].unit = 'ml'; },
    b => { b.recipes[0].ingredients.push({ ...b.recipes[0].ingredients[0] }); },
    b => { b.recipes[0].servings = 3; },
    b => { b.recipes[0].cookingTimeMinutes = 31; },
    b => { b.recipes = []; },
  ]) { const proposal = batch(); change(proposal); assert.throws(() => budget.evaluate(proposal, products, preferences())); }
  assert.throws(() => budget.evaluate(batch(products[0], 1200), products, { ...preferences(), weeklyBudgetCents: 497 }));
});

test('AI schema rejects model prices, fractional quantities and malformed recipe fields', () => {
  for (const change of [
    b => { b.totalCostCents = 1; },
    b => { b.recipes[0].ingredients[0].priceCents = 1; },
    b => { b.recipes[0].ingredients[0].quantity = 0.5; },
    b => { b.recipes[0].steps = []; },
  ]) { const proposal = batch(); change(proposal); assert.equal(recipeBatchSchema.safeParse(proposal).success, false); }
});

test('age is derived at birthdays using the Berlin calendar day, with missing ages left unknown', () => {
  assert.equal(ageFromBirthDate('2000-10-09', new Date('2026-10-08T12:00:00Z')), 25);
  assert.equal(ageFromBirthDate('2000-10-09', new Date('2026-10-08T22:30:00Z')), 26);
  assert.equal(ageFromBirthDate(null), null);
  assert.equal(ageFromBirthDate('2000-02-29', new Date('2025-02-28T12:00:00Z')), 24);
  assert.equal(ageFromBirthDate('2000-02-29', new Date('2025-03-01T12:00:00Z')), 25);
});

test('request validation rejects invalid budgets, excessive requests, unknown allergies and profile fields', async () => {
  assert.equal((await validate(preferences())).length, 0);
  for (const patch of [{ weeklyBudgetCents: '4000' }, { weeklyBudgetCents: 1.2 }, { weeklyBudgetCents: 0 }, { persons: 0 }, { recipeCount: 8 }, { diet: 'unknown' }, { allergies: ['unknown'] }, { allergies: null }, { excludedIngredients: ['unknown'] }, { maxCookingTimeMinutes: 181 }, { userId: 'someone-else' }]) {
    const dto = plainToInstance(GenerateRecipesDto, { ...preferences(), ...patch });
    assert.ok((await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).length > 0, JSON.stringify(patch));
  }
});

test('allergies, diet and exclusions filter the catalog before any AI call', async () => {
  const input = preferences(); input.diet = 'vegan'; input.allergies = ['gluten']; input.excludedIngredients = ['rice'];
  const service = new RecipesService({ forRecipes: async () => products }, {
    generate: async context => {
      assert.ok(context.products.every(p => p.dietaryTags.includes('vegan') && !p.allergens.includes('gluten') && p.ingredientKey !== 'rice'));
      assert.ok(!('birthDate' in context) && !('username' in context) && !('userId' in context));
      assert.equal(context.age, null);
      return batch(context.products[0], 200);
    },
  }, new BudgetService());
  assert.equal((await service.generate(input, null)).priceType, 'test');
});

test('an invalid proposal receives one correction; repeated invalid output is rejected', async () => {
  let calls = 0;
  const service = new RecipesService({ forRecipes: async () => products }, { generate: async context => {
    calls++;
    if (calls === 1) return batch({ ...products[0], id: 'f'.repeat(24) });
    assert.ok(context.correction);
    return batch();
  } }, new BudgetService());
  assert.equal((await service.generate(preferences(), null)).totalCostCents, 249);
  assert.equal(calls, 2);
  calls = 0;
  const failing = new RecipesService({ forRecipes: async () => products }, { generate: async () => { calls++; return batch({ ...products[0], id: 'f'.repeat(24) }); } }, new BudgetService());
  await assert.rejects(failing.generate(preferences(), null), status(422));
  assert.equal(calls, 2);
});

test('empty catalog, missing metadata and unaffordable budgets fail without calling AI', async () => {
  for (const [catalog, input] of [[[], preferences()], [[{ ...products[0], allergens: null }], preferences()], [products, { ...preferences(), weeklyBudgetCents: 1 }]]) {
    const service = new RecipesService({ forRecipes: async () => catalog }, { generate: () => assert.fail('must not call AI') }, new BudgetService());
    await assert.rejects(service.generate(input, null), status(422));
  }
});

test('malformed AI data is rejected and an empty selection returns a clear failure', async () => {
  for (const [output, code] of [[{ recipes: 'broken' }, 502], [{ recipes: [] }, 422]]) {
    const service = new RecipesService({ forRecipes: async () => products }, { generate: async () => output }, new BudgetService());
    await assert.rejects(service.generate(preferences(), null), status(code));
  }
});
