import { Allergen, Diet, IngredientKey, LifeSituation } from './recipe.models';
export const LIFE_OPTIONS: { value: LifeSituation; label: string }[] = [
  { value: 'student', label: 'Student:in' },
  { value: 'employee', label: 'Angestellt' },
  { value: 'self_employed', label: 'Selbstständig' },
  { value: 'unemployed', label: 'Arbeitssuchend' },
  { value: 'retired', label: 'Im Ruhestand' },
  { value: 'other', label: 'Andere Situation' },
];
export const DIET_OPTIONS: { value: Diet; label: string }[] = [
  { value: 'omnivore', label: 'Alles' },
  { value: 'vegetarian', label: 'Vegetarisch' },
  { value: 'vegan', label: 'Vegan' },
];
export const ALLERGEN_OPTIONS: { value: Allergen; label: string }[] = [
  { value: 'gluten', label: 'Gluten' },
  { value: 'crustaceans', label: 'Krebstiere' },
  { value: 'eggs', label: 'Eier' },
  { value: 'fish', label: 'Fisch' },
  { value: 'peanuts', label: 'Erdnüsse' },
  { value: 'soy', label: 'Soja' },
  { value: 'milk', label: 'Milch' },
  { value: 'nuts', label: 'Schalenfrüchte' },
  { value: 'celery', label: 'Sellerie' },
  { value: 'mustard', label: 'Senf' },
  { value: 'sesame', label: 'Sesam' },
  { value: 'sulphites', label: 'Sulfite' },
  { value: 'lupin', label: 'Lupinen' },
  { value: 'molluscs', label: 'Weichtiere' },
];
export const INGREDIENT_OPTIONS: { value: IngredientKey; label: string }[] = [
  { value: 'rice', label: 'Reis' },
  { value: 'pasta', label: 'Nudeln' },
  { value: 'oats', label: 'Haferflocken' },
  { value: 'lentils', label: 'Linsen' },
  { value: 'tomatoes', label: 'Tomaten' },
  { value: 'potatoes', label: 'Kartoffeln' },
  { value: 'carrots', label: 'Karotten' },
  { value: 'onions', label: 'Zwiebeln' },
  { value: 'milk', label: 'Milch' },
  { value: 'eggs', label: 'Eier' },
  { value: 'oil', label: 'Öl' },
  { value: 'chicken', label: 'Hähnchen' },
];
