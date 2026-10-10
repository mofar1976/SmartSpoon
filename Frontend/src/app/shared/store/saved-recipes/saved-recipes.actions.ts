import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  RecipeMode,
  SavableRecipeResult,
} from '../../../features/saved-recipes/saved-recipes.models';
import { SavedRecipe, SavedRecipeList } from '../../../features/saved-recipes/saved-recipes.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export const SavedRecipesActions = createActionGroup({
  source: 'Saved Recipes',
  events: {
    'Load Requested': props<{ requestId: string; id: string | null; offset: number }>(),
    'List Loaded': props<{ requestId: string; list: SavedRecipeList }>(),
    'Detail Loaded': props<{ requestId: string; detail: SavedRecipe }>(),
    'Load Failed': props<{ requestId: string; errorKey: TranslationKey }>(),
    'Save Requested': props<{
      requestId: string;
      result: SavableRecipeResult;
      source: RecipeMode;
      checkedItemIds: string[];
      title: string;
      checkedProductIds: string[];
    }>(),
    'Save Succeeded': props<{ requestId: string; id: string; title: string }>(),
    'Save Failed': props<{ requestId: string; errorKey: TranslationKey }>(),
    'Save Error Set': props<{ errorKey: TranslationKey; source: RecipeMode }>(),
    'Delete Requested': props<{ requestId: string; id: string }>(),
    'Delete Succeeded': props<{ requestId: string; id: string }>(),
    'Delete Failed': props<{ requestId: string; errorKey: TranslationKey }>(),
    'Purchased Changed': props<{ productId: string; purchased: boolean }>(),
    'Clear Delete Error': emptyProps(),
    'Clear View': emptyProps(),
    'Clear Save': props<{ source: RecipeMode }>(),
    'Pantry Purchased Changed': props<{ itemId: string; purchased: boolean }>(),
    Reset: emptyProps(),
  },
});
