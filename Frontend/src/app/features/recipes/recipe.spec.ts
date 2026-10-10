import { describe, expect, it } from 'vitest';
import { createRecipeForm, euroToCents } from './recipe-validation';

describe('recipe input contract', () => {
  it('converts decimal strings to exact cents without float rounding', () => {
    for (const [value, cents] of [
      ['0,01', 1],
      ['0,29', 29],
      ['40', 4000],
      ['40.2', 4020],
      [' 40,29 ', 4029],
      ['1000,00', 100000],
    ] as const)
      expect(euroToCents(value)).toBe(cents);
  });
  it('rejects ambiguous, out-of-range, fractional-cent and malformed budgets', () => {
    for (const value of [
      '',
      '0',
      '-1',
      '1000,01',
      '1.000,00',
      '1,234',
      '1e2',
      'Infinity',
      '€40',
      '1,',
      '.50',
      '1 000',
    ])
      expect(euroToCents(value)).toBeNull();
  });
  it('enforces integer boundaries for people, cooking time and recipe count', () => {
    const form = createRecipeForm();
    for (const value of [0, 11, 1.5]) {
      form.controls.persons.setValue(value);
      expect(form.controls.persons.invalid).toBe(true);
    }
    for (const value of [4, 181, 10.5]) {
      form.controls.maxCookingTimeMinutes.setValue(value);
      expect(form.controls.maxCookingTimeMinutes.invalid).toBe(true);
    }
    for (const value of [0, 8, 2.5]) {
      form.controls.recipeCount.setValue(value);
      expect(form.controls.recipeCount.invalid).toBe(true);
    }
  });
  it('rejects duplicate/unknown allergens and unknown exclusions', () => {
    const form = createRecipeForm();
    form.controls.allergies.setValue(['milk', 'milk']);
    expect(form.controls.allergies.invalid).toBe(true);
    form.controls.allergies.setValue(['unknown' as never]);
    expect(form.controls.allergies.invalid).toBe(true);
    form.controls.excludedIngredients.setValue(['unknown' as never]);
    expect(form.controls.excludedIngredients.invalid).toBe(true);
  });
});
