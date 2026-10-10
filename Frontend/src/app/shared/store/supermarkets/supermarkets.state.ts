import { Market } from '../../../features/recipes/recipe.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export interface SupermarketsState {
  items: Market[];
  status: 'idle' | 'loading' | 'loaded' | 'error';
  errorKey: TranslationKey | null;
}
export const initialSupermarketsState: SupermarketsState = {
  items: [],
  status: 'idle',
  errorKey: null,
};
