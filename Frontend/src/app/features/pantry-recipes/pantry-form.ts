import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { Allergen, Diet, Unit } from '../recipes/recipe.models';
export function normalizedName(name: string) {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('de');
}
const nameValidator = (c: AbstractControl) =>
  typeof c.value === 'string' &&
  c.value.trim().length > 0 &&
  c.value.trim().length <= 80 &&
  !/[\x00-\x1f\x7f]/.test(c.value)
    ? null
    : { name: true };
const integer = (c: AbstractControl) =>
  c.value === null || Number.isInteger(c.value) ? null : { integer: true };
export function ingredientRow(name = '') {
  return new FormGroup(
    {
      name: new FormControl(name, { nonNullable: true, validators: [nameValidator] }),
      quantity: new FormControl<number | null>(null, [
        Validators.min(1),
        Validators.max(100000),
        integer,
      ]),
      unit: new FormControl<Unit | ''>('', { nonNullable: true }),
    },
    {
      validators: (c) =>
        (c.value.quantity !== null) === (c.value.unit !== '') ? null : { amount: true },
    },
  );
}
export type IngredientRow = ReturnType<typeof ingredientRow>;
export function pantryForm() {
  return new FormGroup({
    ingredients: new FormArray<IngredientRow>([], {
      validators: (c) => {
        const names = (c as FormArray<IngredientRow>)
          .getRawValue()
          .map((v) => normalizedName(v.name));
        return names.length < 1 || names.length > 40
          ? { count: true }
          : new Set(names).size !== names.length
            ? { duplicate: true }
            : null;
      },
    }),
    confirmed: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
    persons: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(10), integer],
    }),
    maxCookingTimeMinutes: new FormControl(30, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(5), Validators.max(180), integer],
    }),
    recipeCount: new FormControl(3, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(7), integer],
    }),
    diet: new FormControl<Diet>('omnivore', { nonNullable: true }),
    allergies: new FormControl<Allergen[]>([], { nonNullable: true }),
    excludedIngredients: new FormControl('', {
      nonNullable: true,
      validators: [
        (c) => {
          const names = exclusions(c.value);
          return names.length <= 40 &&
            names.every((n) => n.length <= 80 && !/[\x00-\x1f\x7f]/.test(n))
            ? null
            : { exclusions: true };
        },
      ],
    }),
    allowAdditionalIngredients: new FormControl(false, { nonNullable: true }),
  });
}
export function exclusions(value: string): string[] {
  return [
    ...new Set(
      value
        .split(',')
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
}
export type PantryForm = ReturnType<typeof pantryForm>;
