import { createActionGroup, emptyProps, props } from '@ngrx/store';
import {
  PantryRequest,
  PantryResult,
  RecognitionResult,
} from '../../../features/pantry-recipes/pantry-recipes.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export const PantryActions = createActionGroup({
  source: 'Pantry Recipes',
  events: {
    'Analysis Requested': props<{ requestId: number }>(),
    'Analysis Succeeded': props<{ requestId: number; recognition: RecognitionResult }>(),
    'Generation Requested': props<{ requestId: number; request: PantryRequest }>(),
    'Generation Succeeded': props<{ requestId: number; result: PantryResult }>(),
    Failed: props<{ requestId: number; errorKey: TranslationKey }>(),
    Cancel: emptyProps(),
    Reset: emptyProps(),
    'Draft Changed': emptyProps(),
    'Purchased Changed': props<{ itemId: string; purchased: boolean }>(),
  },
});
