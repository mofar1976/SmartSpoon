import type { TranslationKey } from '../../core/i18n/translation-key';
import { HttpErrorResponse } from '@angular/common/http';
export function authErrorKey(error: unknown, register: boolean): TranslationKey {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) return 'errors.authCredentials';
    if (error.status === 409 && register) return 'errors.authConflict';
    if (error.status === 400) return 'errors.authInvalid';
    if (error.status === 429) return 'errors.authRateLimit';
    if (error.status === 0 || error.status >= 500) return 'errors.authConnection';
  }
  return 'errors.authUnknown';
}
