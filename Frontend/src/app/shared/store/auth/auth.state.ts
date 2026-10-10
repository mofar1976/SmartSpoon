import { User } from '../../models';
import { TranslationKey } from '../../../core/i18n/translation-key';
export type SessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unavailable';
export interface AuthState {
  initialized: boolean;
  token: string | null;
  user: User | null;
  status: SessionStatus;
  expired: boolean;
  restoreRequestId: number | null;
  authenticationRequestId: number | null;
  errorKey: TranslationKey | null;
}
export const initialAuthState: AuthState = {
  initialized: false,
  token: null,
  user: null,
  status: 'anonymous',
  expired: false,
  restoreRequestId: null,
  authenticationRequestId: null,
  errorKey: null,
};
