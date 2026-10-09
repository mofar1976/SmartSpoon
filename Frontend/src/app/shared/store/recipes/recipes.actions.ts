import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { RecipeRequest, RecipeResult } from '../../../features/recipes/recipe.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export const RecipesActions = createActionGroup({
  source: 'Recipes',
  events: {
    'Generate Requested': props<{ requestId: number; request: RecipeRequest }>(),
    'Generate Succeeded': props<{ requestId: number; result: RecipeResult }>(),
    'Generate Failed': props<{ requestId: number; errorKey: TranslationKey }>(),
    'Purchased Changed': props<{ productId: string; purchased: boolean }>(),
    'Error Set': props<{ errorKey: TranslationKey | null }>(),
    Cancel: emptyProps(),
    Reset: emptyProps(),
  },
});
