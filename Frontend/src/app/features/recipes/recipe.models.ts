export type Supermarket = 'rewe' | 'aldi' | 'lidl';
export type Diet = 'omnivore' | 'vegetarian' | 'vegan';
export type LifeSituation =
  'student' | 'employee' | 'self_employed' | 'unemployed' | 'retired' | 'other';
export type Allergen =
  | 'gluten'
  | 'crustaceans'
  | 'eggs'
  | 'fish'
  | 'peanuts'
  | 'soy'
  | 'milk'
  | 'nuts'
  | 'celery'
  | 'mustard'
  | 'sesame'
  | 'sulphites'
  | 'lupin'
  | 'molluscs';
export type IngredientKey =
  | 'rice'
  | 'pasta'
  | 'oats'
  | 'lentils'
  | 'tomatoes'
  | 'potatoes'
  | 'carrots'
  | 'onions'
  | 'milk'
  | 'eggs'
  | 'oil'
  | 'chicken';
export type Unit = 'g' | 'ml' | 'piece';
export interface RecipeRequest {
  supermarket: Supermarket;
  weeklyBudgetCents: number;
  persons: number;
  lifeSituation: LifeSituation;
  diet: Diet;
  allergies: Allergen[];
  excludedIngredients: IngredientKey[];
  maxCookingTimeMinutes: number;
  recipeCount: number;
}
export interface Market {
  id: Supermarket;
  name: string;
}
export interface Recipe {
  title: string;
  servings: number;
  cookingTimeMinutes: number;
  ingredients: { productId: string; productName: string; quantity: number; unit: Unit }[];
  steps: string[];
}
export interface ShoppingProduct {
  id: string;
  name: string;
  supermarket: Supermarket;
  packageQuantity: number;
  packageUnit: Unit;
  priceCents: number;
  currency: string;
  priceType: string;
}
export interface RecipeResult {
  saveProof?: string;
  recipes: Recipe[];
  shoppingList: {
    product: ShoppingProduct;
    neededQuantity: number;
    packs: number;
    purchasedQuantity: number;
    leftoverQuantity: number;
    costCents: number;
  }[];
  totalCostCents: number;
  remainingBudgetCents: number;
  currency: string;
  priceType: string;
  priceNotice: string;
}
