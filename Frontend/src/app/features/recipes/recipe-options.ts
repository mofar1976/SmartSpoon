import type { TranslationKey } from '../../core/i18n/translation-key';
import { Allergen, Diet, IngredientKey, LifeSituation } from './recipe.models';
export const LIFE_OPTIONS: { value: LifeSituation; label: TranslationKey }[] = [
  { value: 'student', label: 'options.student' },
  { value: 'employee', label: 'options.employee' },
  { value: 'self_employed', label: 'options.selfEmployed' },
  { value: 'unemployed', label: 'options.unemployed' },
  { value: 'retired', label: 'options.retired' },
  { value: 'other', label: 'options.otherLife' },
];
export const DIET_OPTIONS: { value: Diet; label: TranslationKey }[] = [
  { value: 'omnivore', label: 'options.omnivore' },
  { value: 'vegetarian', label: 'options.vegetarian' },
  { value: 'vegan', label: 'options.vegan' },
];
export const ALLERGEN_OPTIONS: { value: Allergen; label: TranslationKey }[] = [
  { value: 'gluten', label: 'options.gluten' },
  { value: 'crustaceans', label: 'options.crustaceans' },
  { value: 'eggs', label: 'options.eggs' },
  { value: 'fish', label: 'options.fish' },
  { value: 'peanuts', label: 'options.peanuts' },
  { value: 'soy', label: 'options.soy' },
  { value: 'milk', label: 'options.milk' },
  { value: 'nuts', label: 'options.nuts' },
  { value: 'celery', label: 'options.celery' },
  { value: 'mustard', label: 'options.mustard' },
  { value: 'sesame', label: 'options.sesame' },
  { value: 'sulphites', label: 'options.sulphites' },
  { value: 'lupin', label: 'options.lupin' },
  { value: 'molluscs', label: 'options.molluscs' },
];
export const INGREDIENT_OPTIONS: { value: IngredientKey; label: TranslationKey }[] = [
  { value: 'rice', label: 'options.rice' },
  { value: 'pasta', label: 'options.pasta' },
  { value: 'oats', label: 'options.oats' },
  { value: 'lentils', label: 'options.lentils' },
  { value: 'tomatoes', label: 'options.tomatoes' },
  { value: 'potatoes', label: 'options.potatoes' },
  { value: 'carrots', label: 'options.carrots' },
  { value: 'onions', label: 'options.onions' },
  { value: 'milk', label: 'options.milk' },
  { value: 'eggs', label: 'options.eggs' },
  { value: 'oil', label: 'options.oil' },
  { value: 'chicken', label: 'options.chicken' },
];
