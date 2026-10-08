const { test } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { plainToInstance } = require('class-transformer');
const { validate } = require('class-validator');
const { TEST_PRODUCTS } = require('../dist/modules/products/data/test-products');
const { ProductSchema } = require('../dist/modules/products/schemas/product.schema');
const { ListProductsDto } = require('../dist/modules/products/dto/list-products.dto');
const Product = mongoose.model('ProductUnitTest', ProductSchema);

test('all test fixtures have valid package prices, unique identifiers and no invented provenance', async () => {
  assert.equal(TEST_PRODUCTS.length, 36);
  assert.equal(new Set(TEST_PRODUCTS.map(p => p.sku)).size, 36);
  for (const product of TEST_PRODUCTS) {
    await new Product(product).validate();
    assert.equal(product.priceType, 'test');
    assert.match(product.sourceLabel, /Fiktive Testpreise/);
    assert.equal(product.sourceUrl, null);
    assert.equal(product.location, null);
    assert.equal(product.observedAt, null);
  }
});

test('product schema rejects fractional money, unsafe integers and invalid package quantities', async () => {
  for (const patch of [{ priceCents: 1.5 }, { priceCents: -1 }, { priceCents: Number.MAX_SAFE_INTEGER + 1 }, { packageQuantity: 0 }, { packageQuantity: 1.5 }, { packageUnit: 'kg' }]) {
    await assert.rejects(new Product({ ...TEST_PRODUCTS[0], ...patch }).validate());
  }
});

test('product queries convert integer strings and reject invalid or unbounded pagination', async () => {
  const valid = plainToInstance(ListProductsDto, { supermarket: 'rewe', limit: '5', offset: '2' });
  assert.equal((await validate(valid)).length, 0);
  assert.equal(valid.limit, 5);
  assert.equal(valid.offset, 2);
  for (const query of [{ supermarket: 'unknown' }, { supermarket: { $ne: null } }, { limit: '' }, { limit: '0' }, { limit: '101' }, { limit: '1.5' }, { limit: ['1', '2'] }, { offset: '-1' }, { offset: '100001' }]) {
    assert.ok((await validate(plainToInstance(ListProductsDto, query))).length > 0);
  }
});
