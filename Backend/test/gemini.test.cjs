const { test } = require('node:test');
const assert = require('node:assert/strict');
const { ConfigService } = require('@nestjs/config');
const { GeminiProvider } = require('../dist/modules/ai/gemini.provider');
const { products, preferences, batch } = require('./recipe-fixtures.cjs');
const context = { products, preferences: preferences(), age: 26 };
const config = new ConfigService({ GEMINI_API_KEY: 'test-key', GEMINI_MODEL: 'gemini-3.5-flash-lite' });

test('Gemini requests structured JSON with a bounded timeout and no automatic retries', async () => {
  const provider = new GeminiProvider(config, { models: { generateContent: async request => {
    assert.equal(request.model, 'gemini-3.5-flash-lite');
    assert.equal(request.config.responseMimeType, 'application/json');
    assert.equal(request.config.responseJsonSchema, undefined);
    assert.equal(request.config.responseSchema.type, 'OBJECT');
    assert.equal(request.config.responseSchema.properties.recipes.items.properties.ingredients.items.properties.quantity.type, 'INTEGER');
    assert.deepEqual(request.config.responseSchema.properties.recipes.items.properties.ingredients.items.properties.unit.enum, ['g', 'ml', 'piece']);
    assert.equal(request.config.httpOptions.timeout, 30000);
    assert.equal(request.config.httpOptions.retryOptions.attempts, 1);
    assert.deepEqual(JSON.parse(request.contents), JSON.parse(JSON.stringify(context)));
    return { text: JSON.stringify(batch()) };
  } } });
  assert.deepEqual(await provider.generate(context), batch());
});

test('missing Gemini key fails before any remote request', async () => {
  const provider = new GeminiProvider(new ConfigService({ GEMINI_MODEL: 'gemini-3.5-flash-lite' }), { models: { generateContent: () => assert.fail('must not call') } });
  await assert.rejects(provider.generate(context), error => error.getStatus() === 503);
});

test('upstream failures are mapped without exposing keys or provider details', async () => {
  for (const [failure, status] of [[{ status: 429, message: 'secret' }, 503], [{ status: 503 }, 503], [{ status: 504 }, 504], [new Error('timeout secret'), 504], [new Error('secret-key'), 502]]) {
    const provider = new GeminiProvider(config, { models: { generateContent: async () => { throw failure; } } });
    await assert.rejects(provider.generate(context), error => { assert.equal(error.getStatus(), status); assert.ok(!JSON.stringify(error.getResponse()).includes('secret')); return true; });
  }
});

test('malformed, truncated, empty and oversized Gemini output is rejected', async () => {
  for (const text of [undefined, '{', JSON.stringify({ recipes: 'invalid' }), 'x'.repeat(100001)]) {
    const provider = new GeminiProvider(config, { models: { generateContent: async () => ({ text }) } });
    await assert.rejects(provider.generate(context), error => error.getStatus() === 502);
  }
});
