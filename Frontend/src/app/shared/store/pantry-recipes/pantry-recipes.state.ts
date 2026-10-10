import {
  RecognitionResult,
  PantryResult,
} from '../../../features/pantry-recipes/pantry-recipes.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export interface PantryState {
  checkedItemIds: string[];
  recognition: RecognitionResult | null;
  result: PantryResult | null;
  operation: 'analysis' | 'generation' | null;
  requestId: number | null;
  errorKey: TranslationKey | null;
}
export const initialPantryState: PantryState = {
  checkedItemIds: [],
  recognition: null,
  result: null,
  operation: null,
  requestId: null,
  errorKey: null,
};
