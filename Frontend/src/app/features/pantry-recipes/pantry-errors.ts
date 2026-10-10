import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { TranslationKey } from '../../core/i18n/translation-key';
export function pantryErrorKey(
  error: unknown,
  operation: 'analysis' | 'generation',
): TranslationKey {
  if (error instanceof TimeoutError) return 'pantry.errorTimeout';
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 0:
        return 'pantry.errorConnection';
      case 401:
        return 'errors.sessionExpired';
      case 413:
        return 'pantry.errorSize';
      case 422:
        return operation === 'analysis' ? 'pantry.errorInvalid' : 'pantry.errorNoRecipes';
      case 429:
        return 'pantry.errorBusy';
      case 504:
        return 'pantry.errorTimeout';
      case 400:
        return 'pantry.errorInput';
      case 502:
        return operation === 'analysis'
          ? 'pantry.errorRecognitionResult'
          : 'pantry.errorRecipeResult';
      case 503:
        if (operation === 'analysis') {
          return error.error?.code === 'RECOGNITION_NOT_CONFIGURED'
            ? 'pantry.errorRecognitionSetup'
            : 'pantry.errorRecognitionUnavailable';
        }
    }
  }
  return 'pantry.errorUnavailable';
}
