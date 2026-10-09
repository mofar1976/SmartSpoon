import { RecipeResult } from '../../../features/recipes/recipe.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export interface RecipesState {
  result: RecipeResult | null;
  requestId: number | null;
  checkedProductIds: string[];
  errorKey: TranslationKey | null;
}
export const initialRecipesState: RecipesState = {
  result: null,
  requestId: null,
  checkedProductIds: [],
  errorKey: null,
};
