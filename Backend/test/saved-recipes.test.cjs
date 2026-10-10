const { test } = require('node:test');
const assert = require('node:assert/strict');
const { JwtService } = require('@nestjs/jwt');
const { SnapshotProofService } = require('../dist/modules/saved-recipes/snapshot-proof.service');
const { SavedRecipesService } = require('../dist/modules/saved-recipes/saved-recipes.service');
const { BudgetService } = require('../dist/modules/recipes/budget.service');
const { products, preferences, batch } = require('./recipe-fixtures.cjs');
const owner = '1'.repeat(24),
  jwt = new JwtService({ secret: 'test-only-secret-more-than-32-characters' }),
  proofs = new SnapshotProofService(jwt);
const snapshot = () => ({
  ...new BudgetService().evaluate(batch(), products, preferences()),
  priceType: 'test',
  priceNotice: 'Testpreise.',
});
const response = async () => {
  const result = snapshot();
  return { ...result, saveProof: await proofs.issue(result, owner) };
};
const status = (code) => (e) => e.getStatus() === code;
test('save proof protects prices, text, amounts and owner but permits reordered object keys', async () => {
  const result = await response();
  assert.deepEqual(
    (await proofs.verify(Object.fromEntries(Object.entries(result).reverse()), owner)).snapshot,
    snapshot(),
  );
  for (const modify of [
    (r) => r.totalCostCents++,
    (r) => (r.recipes[0].steps[0] = 'changed'),
    (r) => r.shoppingList[0].leftoverQuantity++,
  ]) {
    const changed = structuredClone(result);
    modify(changed);
    await assert.rejects(proofs.verify(changed, owner), status(400));
  }
  await assert.rejects(proofs.verify(result, '2'.repeat(24)), status(400));
  await assert.rejects(
    jwt.verifyAsync(result.saveProof, { audience: 'smartspoon-api', issuer: 'smartspoon' }),
  );
});
test('expired and missing proofs are rejected', async () => {
  const result = await response(),
    claims = jwt.decode(result.saveProof);
  delete claims.iat;
  delete claims.exp;
  const expired = await jwt.signAsync(claims, { expiresIn: -1 });
  await assert.rejects(proofs.verify({ ...result, saveProof: expired }, owner), status(400));
  await assert.rejects(proofs.verify({ ...result, saveProof: undefined }, owner), status(400));
});
test('save uses a user-scoped upsert and stores a complete snapshot without the proof', async () => {
  const result = await response();
  let recorded;
  const service = new SavedRecipesService(
    {
      findOneAndUpdate: (filter, update, options) => {
        recorded = { filter, update, options };
        return {
          exec: async () => ({
            ...update.$setOnInsert,
            id: 'saved',
            createdAt: new Date('2026-01-01'),
          }),
        };
      },
    },
    proofs,
  );
  const saved = await service.save({ result, checkedProductIds: [products[0].id] }, owner);
  assert.deepEqual(saved.result, snapshot());
  assert.equal(saved.result.saveProof, undefined);
  assert.equal(String(recorded.filter.ownerId), owner);
  assert.ok(recorded.filter.sourceId);
  assert.equal(recorded.options.upsert, true);
  await assert.rejects(
    service.save({ result, checkedProductIds: ['f'.repeat(24)] }, owner),
    status(400),
  );
});
test('get and delete always filter by owner and conceal other users records', async () => {
  const calls = [],
    service = new SavedRecipesService(
      {
        findOne: (f) => {
          calls.push(f);
          return { exec: async () => null };
        },
        deleteOne: (f) => {
          calls.push(f);
          return { exec: async () => ({ deletedCount: 0 }) };
        },
      },
      proofs,
    );
  await assert.rejects(service.findOne('2'.repeat(24), owner), status(404));
  await assert.rejects(service.remove('2'.repeat(24), owner), status(404));
  assert.ok(calls.every((f) => String(f.ownerId) === owner));
});

const pantrySnapshot = () => ({
  mode: 'pantry',
  requiresIngredientReview: true,
  notice: 'Zutaten prüfen.',
  recipes: [
    {
      title: 'Banane mit Haferflocken',
      servings: 1,
      cookingTimeMinutes: 5,
      ingredients: [
        {
          ingredientId: 'ingredient-1',
          name: 'Banane',
          quantity: 1,
          unit: 'piece',
          source: 'available',
        },
        { ingredientId: null, name: 'Haferflocken', quantity: 50, unit: 'g', source: 'additional' },
      ],
      steps: ['Banane schneiden.'],
      shoppingList: [{ id: 'recipe-1-item-1', name: 'Haferflocken', quantity: 50, unit: 'g' }],
    },
  ],
});
test('pantry proofs protect recipe type, shopping IDs, review notice and amounts; owner and expiry apply', async () => {
  const snapshot = pantrySnapshot(),
    result = { ...snapshot, saveProof: await proofs.issue(snapshot, owner) };
  assert.deepEqual((await proofs.verify(result, owner)).snapshot, snapshot);
  for (const mutate of [
    (r) => (r.mode = 'market'),
    (r) => (r.requiresIngredientReview = false),
    (r) => (r.notice = ''),
    (r) => (r.recipes[0].shoppingList[0].id = 'recipe-1-item-2'),
    (r) => r.recipes[0].ingredients[0].quantity++,
    (r) => (r.recipes[0].steps[0] = 'Changed'),
  ]) {
    const changed = structuredClone(result);
    mutate(changed);
    await assert.rejects(proofs.verify(changed, owner), status(400));
  }
  await assert.rejects(proofs.verify(result, '2'.repeat(24)), status(400));
  const claims = jwt.decode(result.saveProof);
  delete claims.iat;
  delete claims.exp;
  const expired = await jwt.signAsync(claims, { expiresIn: -1 });
  await assert.rejects(proofs.verify({ ...result, saveProof: expired }, owner), status(400));
});
