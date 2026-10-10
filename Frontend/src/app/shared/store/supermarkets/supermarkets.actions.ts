import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Market } from '../../../features/recipes/recipe.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export const SupermarketsActions = createActionGroup({
  source: 'Supermarkets',
  events: {
    'Load Requested': emptyProps(),
    'Load Succeeded': props<{ items: Market[] }>(),
    'Load Failed': props<{ errorKey: TranslationKey }>(),
    Reset: emptyProps(),
  },
});
