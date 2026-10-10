import { createReducer, on } from '@ngrx/store';
import { AuthActions } from './auth.actions';
import { initialAuthState } from './auth.state';
export const authReducer = createReducer(
  initialAuthState,
  on(AuthActions.hydrated, (state, { token, expired }) => ({
    ...initialAuthState,
    initialized: true,
    token,
    expired,
    status: token ? ('checking' as const) : ('anonymous' as const),
  })),
  on(AuthActions.restoreRequested, (state, { requestId }) => ({
    ...state,
    status: 'checking' as const,
    restoreRequestId: requestId,
  })),
  on(AuthActions.restoreSucceeded, (state, { requestId, token, user }) =>
    state.restoreRequestId === requestId && state.token === token
      ? { ...state, user, status: 'authenticated' as const, expired: false, restoreRequestId: null }
      : state,
  ),
  on(AuthActions.restoreFailed, (state, { requestId, token }) =>
    state.restoreRequestId === requestId && state.token === token
      ? { ...state, user: null, status: 'unavailable' as const, restoreRequestId: null }
      : state,
  ),
  on(AuthActions.loginRequested, AuthActions.registerRequested, (state, { requestId }) => ({
    ...state,
    authenticationRequestId: requestId,
    errorKey: null,
  })),
  on(AuthActions.authenticationSucceeded, (state, { requestId, token, user }) =>
    state.authenticationRequestId === requestId
      ? {
          ...state,
          initialized: true,
          token,
          user,
          status: 'authenticated' as const,
          expired: false,
          restoreRequestId: null,
          authenticationRequestId: null,
          errorKey: null,
        }
      : state,
  ),
  on(AuthActions.authenticationFailed, (state, { requestId, errorKey }) =>
    state.authenticationRequestId === requestId
      ? { ...state, authenticationRequestId: null, errorKey }
      : state,
  ),
  on(AuthActions.clearForm, (state) => ({
    ...state,
    authenticationRequestId: null,
    errorKey: null,
  })),
  on(AuthActions.logout, () => ({ ...initialAuthState, initialized: true })),
  on(AuthActions.sessionExpired, (state, { token }) =>
    state.token === token ? { ...initialAuthState, initialized: true, expired: true } : state,
  ),
);
