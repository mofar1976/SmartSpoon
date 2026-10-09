import { expect, it } from 'vitest';
import { safeReturnUrl } from '../../shared/guards/return-url';
const id = '1'.repeat(24);
it('allows return only to known internal saved-selection routes', () => {
  expect(safeReturnUrl('/gespeichert')).toBe('/gespeichert');
  expect(safeReturnUrl('/gespeichert/' + id)).toBe('/gespeichert/' + id);
  for (const url of [
    '//external.test',
    'https://external.test',
    '/gespeichert/invalid',
    '/gespeichert/' + id + '?next=external',
  ])
    expect(safeReturnUrl(url)).toBe('/rezepte');
});
