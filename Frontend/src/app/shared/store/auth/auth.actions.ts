import { createActionGroup, emptyProps, props } from '@ngrx/store';
import { Credentials, Registration, User } from '../../models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export const AuthActions = createActionGroup({
  source: 'Auth',
  events: {
    Initialize: emptyProps(),
    Hydrated: props<{ token: string | null; expired: boolean }>(),
    'Restore Requested': props<{ requestId: number }>(),
    'Restore Succeeded': props<{ requestId: number; token: string; user: User }>(),
    'Restore Failed': props<{ requestId: number; token: string }>(),
    'Login Requested': props<{ requestId: number; credentials: Credentials; returnUrl: string }>(),
    'Register Requested': props<{
      requestId: number;
      registration: Registration;
      returnUrl: string;
    }>(),
    'Authentication Succeeded': props<{
      requestId: number;
      token: string;
      user: User;
      returnUrl: string;
    }>(),
    'Authentication Failed': props<{ requestId: number; errorKey: TranslationKey }>(),
    'Session Expired': props<{ token: string }>(),
    Logout: emptyProps(),
    'Clear Form': emptyProps(),
  },
});
