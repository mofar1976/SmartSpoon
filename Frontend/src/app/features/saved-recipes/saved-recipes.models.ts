import { RecipeResult } from '../recipes/recipe.models';
export interface SavedRecipeSummary {
  id: string;
  title: string;
  generatedAt: string;
  createdAt: string;
  totalCostCents: number;
  currency: string;
  priceType: string;
  recipeTitles: string[];
}
export interface SavedRecipe extends Omit<
  SavedRecipeSummary,
  'totalCostCents' | 'currency' | 'priceType' | 'recipeTitles'
> {
  result: RecipeResult;
  checkedProductIds: string[];
}
export interface SavedRecipeList {
  items: SavedRecipeSummary[];
  total: number;
  limit: number;
  offset: number;
}
