import { Allergen, Diet, Unit } from '../recipes/recipe.models';
export interface RecognitionResult {
  model: string;
  requiresConfirmation: true;
  ingredients: { name: string; evidence: string }[];
  uncertainItems: string[];
}
export interface PantryIngredient {
  name: string;
  quantity?: number;
  unit?: Unit;
}
export interface PantryRequest {
  ingredientsConfirmed: true;
  ingredients: PantryIngredient[];
  persons: number;
  maxCookingTimeMinutes: number;
  recipeCount: number;
  diet: Diet;
  allergies: Allergen[];
  excludedIngredients: string[];
  allowAdditionalIngredients: boolean;
}
export interface PantryResult {
  saveProof?: string;
  mode: 'pantry';
  requiresIngredientReview: true;
  notice: string;
  recipes: {
    title: string;
    servings: number;
    cookingTimeMinutes: number;
    ingredients: {
      ingredientId: string | null;
      name: string;
      quantity: number;
      unit: Unit;
      source: 'available' | 'additional';
    }[];
    steps: string[];
    shoppingList: { id: string; name: string; quantity: number; unit: Unit }[];
  }[];
}
