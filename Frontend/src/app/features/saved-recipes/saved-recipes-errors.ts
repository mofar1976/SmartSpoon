import type { TranslationKey } from '../../core/i18n/translation-key';
import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
export function savedRecipesErrorKey(
  error: unknown,
  action: 'save' | 'load' | 'delete',
): TranslationKey {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'errors.sessionExpired';
    if (error.status === 404) return 'errors.savedNotFound';
    if (error.status === 400 && action === 'save') return 'errors.savedProof';
    if (error.status === 429) return 'errors.savedRateLimit';
  }
  if (action === 'save') return 'errors.savedUnconfirmed';
  if (error instanceof TimeoutError) return 'errors.savedTimeout';
  return action === 'delete' ? 'errors.savedDelete' : 'errors.savedLoad';
}
