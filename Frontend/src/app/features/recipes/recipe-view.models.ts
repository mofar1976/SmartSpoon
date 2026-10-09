import { createRecipeForm } from './recipe-validation';
export type RecipeForm = ReturnType<typeof createRecipeForm>;
export interface RecipeSummary {
  budgetCents: number | null;
  persons: number;
  minutes: number;
  life: string;
  diet: string;
  allergies: string;
  exclusions: string;
}
