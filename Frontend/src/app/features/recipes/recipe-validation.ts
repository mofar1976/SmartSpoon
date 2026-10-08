import {
  AbstractControl,
  FormControl,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Allergen, Diet, IngredientKey, LifeSituation, Supermarket } from './recipe.models';
import { ALLERGEN_OPTIONS, DIET_OPTIONS, INGREDIENT_OPTIONS, LIFE_OPTIONS } from './recipe-options';

export function euroToCents(value: string): number | null {
  const clean = value.trim();
  // No rounding of floats, grouping separators, exponents or ambiguous formats.
  if (!/^\d{1,4}(?:[,.]\d{1,2})?$/.test(clean)) return null;
  const [whole, fraction = ''] = clean.replace(',', '.').split('.');
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return cents >= 1 && cents <= 100000 ? cents : null;
}
export const budgetValidator: ValidatorFn = (control) =>
  euroToCents(String(control.value ?? '')) === null ? { budget: true } : null;
export const integerRange =
  (min: number, max: number): ValidatorFn =>
  (control) =>
    Number.isInteger(control.value) && control.value >= min && control.value <= max
      ? null
      : { integerRange: true };
export const oneOf =
  (values: readonly string[]): ValidatorFn =>
  (control) =>
    values.includes(control.value) ? null : { selection: true };
export const listOf =
  (values: readonly string[]): ValidatorFn =>
  (control: AbstractControl): ValidationErrors | null => {
    const list: unknown = control.value;
    return Array.isArray(list) &&
      list.length <= values.length &&
      new Set(list).size === list.length &&
      list.every((value) => values.includes(value))
      ? null
      : { selection: true };
  };
export function createRecipeForm() {
  return new FormGroup({
    supermarket: new FormControl<Supermarket | ''>('', {
      nonNullable: true,
      validators: [Validators.required, oneOf(['rewe', 'aldi', 'lidl'])],
    }),
    budgetEuros: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, budgetValidator],
    }),
    persons: new FormControl(1, { nonNullable: true, validators: [integerRange(1, 10)] }),
    lifeSituation: new FormControl<LifeSituation | ''>('', {
      nonNullable: true,
      validators: [Validators.required, oneOf(LIFE_OPTIONS.map((o) => o.value))],
    }),
    diet: new FormControl<Diet>('omnivore', {
      nonNullable: true,
      validators: [oneOf(DIET_OPTIONS.map((o) => o.value))],
    }),
    allergies: new FormControl<Allergen[]>([], {
      nonNullable: true,
      validators: [listOf(ALLERGEN_OPTIONS.map((o) => o.value))],
    }),
    excludedIngredients: new FormControl<IngredientKey[]>([], {
      nonNullable: true,
      validators: [listOf(INGREDIENT_OPTIONS.map((o) => o.value))],
    }),
    maxCookingTimeMinutes: new FormControl(30, {
      nonNullable: true,
      validators: [integerRange(5, 180)],
    }),
    recipeCount: new FormControl(3, { nonNullable: true, validators: [integerRange(1, 7)] }),
  });
}
