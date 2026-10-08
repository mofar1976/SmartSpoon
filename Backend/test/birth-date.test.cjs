const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isValidBirthDate } = require('../dist/modules/auth/dto/register.dto');
const now = new Date('2026-10-08T12:00:00Z');

test('birth date accepts calendar dates including valid leap days', () => {
  for (const value of ['2000-02-29', '2004-02-29', '2000-05-15', '2026-10-08']) {
    assert.equal(isValidBirthDate(value, now), true, value);
  }
});

test('birth date rejects invalid dates, future dates and alternate formats', () => {
  for (const value of [undefined, null, 2000, '0000-01-01', '1900-02-29', '2001-02-29', '2000-04-31', '2026-10-09', '2000-13-01', '15.05.2000', '2000-5-15', '2000-05-15T00:00:00Z']) {
    assert.equal(isValidBirthDate(value, now), false, String(value));
  }
});

test('birth date uses the calendar day in Europe/Berlin around midnight', () => {
  assert.equal(isValidBirthDate('2026-10-09', new Date('2026-10-08T22:30:00Z')), true);
  assert.equal(isValidBirthDate('2026-10-10', new Date('2026-10-08T22:30:00Z')), false);
});
