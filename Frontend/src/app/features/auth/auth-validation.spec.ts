import { FormControl } from '@angular/forms';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { berlinToday, birthDateValidator, usernameValidator } from './auth-validation';
import { HttpErrorResponse } from '@angular/common/http';
import { authErrorMessage } from './auth-errors';

afterEach(() => vi.useRealTimers());
describe('registration validation', () => {
  it('normalizes accepted usernames and rejects unsupported names', () => {
    expect(usernameValidator(new FormControl(' Student_01 '))).toBeNull();
    for (const name of ['', 'ab', 'a'.repeat(31), 'name@example', 'äbc', 'a b'])
      expect(usernameValidator(new FormControl(name))).not.toBeNull();
  });
  it('accepts leap days and rejects invalid calendar dates and future dates', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T12:00:00Z'));
    expect(birthDateValidator(new FormControl('2000-02-29'))).toBeNull();
    for (const date of [
      '',
      '1900-02-29',
      '2001-02-29',
      '2000-04-31',
      '0000-01-01',
      '2026-10-09',
      '01.01.2000',
    ])
      expect(birthDateValidator(new FormControl(date))).not.toBeNull();
  });
  it('uses Berlin calendar days rather than UTC for the birthday limit', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-08T22:30:00Z'));
    expect(berlinToday()).toBe('2026-10-09');
    expect(birthDateValidator(new FormControl('2026-10-09'))).toBeNull();
  });
  it('shows friendly errors without exposing provider or server details', () => {
    for (const status of [0, 400, 401, 409, 429, 500]) {
      const error = new HttpErrorResponse({ status, error: { message: 'secret-server-detail' } });
      expect(authErrorMessage(error, true)).not.toContain('secret-server-detail');
    }
    expect(authErrorMessage(new HttpErrorResponse({ status: 409 }), true)).toContain('vergeben');
    expect(authErrorMessage(new HttpErrorResponse({ status: 429 }), false)).toContain('Minute');
  });
});
