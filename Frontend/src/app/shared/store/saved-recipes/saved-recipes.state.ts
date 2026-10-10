import { SavedRecipe, SavedRecipeList } from '../../../features/saved-recipes/saved-recipes.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export interface SavedRecipesState {
  list: SavedRecipeList | null;
  detail: SavedRecipe | null;
  checkedProductIds: string[];
  checkedItemIds: string[];
  saveSource: 'market' | 'pantry' | null;
  loadRequestId: string | null;
  deleteRequestId: string | null;
  saveRequestId: string | null;
  errorKey: TranslationKey | null;
  deleteErrorKey: TranslationKey | null;
  saveErrorKey: TranslationKey | null;
  deletedId: string | null;
  savedId: string | null;
  savedTitle: string | null;
}
export const initialSavedRecipesState: SavedRecipesState = {
  list: null,
  detail: null,
  checkedProductIds: [],
  checkedItemIds: [],
  saveSource: null,
  loadRequestId: null,
  deleteRequestId: null,
  saveRequestId: null,
  errorKey: null,
  deleteErrorKey: null,
  saveErrorKey: null,
  deletedId: null,
  savedId: null,
  savedTitle: null,
};
