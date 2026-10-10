import { RecipeResult } from '../recipes/recipe.models';
import { PantryResult } from '../pantry-recipes/pantry-recipes.models';
export type RecipeMode = 'market' | 'pantry';
export type SavableRecipeResult = RecipeResult | PantryResult;
export function isPantryResult(result: SavableRecipeResult): result is PantryResult {
  return 'mode' in result && result.mode === 'pantry';
}
interface SavedSelectionMetadata {
  id: string;
  title: string;
  generatedAt: string;
  createdAt: string;
}
export type SavedRecipeSummary = SavedSelectionMetadata & { recipeTitles: string[] } & (
    | { mode?: 'market'; totalCostCents: number; currency: string; priceType: string }
    | { mode: 'pantry' }
  );
export type SavedRecipe = SavedSelectionMetadata & {
  checkedProductIds: string[];
  checkedItemIds?: string[];
} & ({ mode?: 'market'; result: RecipeResult } | { mode: 'pantry'; result: PantryResult });
export interface SavedRecipeList {
  items: SavedRecipeSummary[];
  total: number;
  limit: number;
  offset: number;
}
export interface SaveViewModel {
  busy: boolean;
  savedId: string | null;
  savedTitle: string | null;
  errorKey: import('../../core/i18n/translation-key').TranslationKey | null;
}
