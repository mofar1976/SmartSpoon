import type { TranslationKey } from '../../core/i18n/translation-key';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
export function recipeErrorKey(error: unknown): TranslationKey {
  if (error instanceof TimeoutError) return 'errors.recipeTimeout';
  if (error instanceof HttpErrorResponse) {
    switch (error.status) {
      case 400:
        return 'errors.recipeInvalid';
      case 401:
        return 'errors.sessionExpired';
      case 422:
        return 'errors.recipeUnfeasible';
      case 429:
        return 'errors.recipeRateLimit';
      case 502:
        return 'errors.recipeResponse';
      case 503:
        return 'errors.recipeUnavailable';
      case 504:
        return 'errors.recipeUpstreamTimeout';
      case 0:
        return 'errors.recipeConnection';
    }
  }
  return 'errors.recipeUnknown';
}
