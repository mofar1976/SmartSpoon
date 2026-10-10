import { createFeatureSelector, createSelector } from '@ngrx/store';
import { AuthState } from './auth.state';
export const selectAuthState = createFeatureSelector<AuthState>('auth');
export const selectUser = createSelector(selectAuthState, (state) => state.user);
export const selectToken = createSelector(selectAuthState, (state) => state.token);
export const selectAuthenticated = createSelector(
  selectAuthState,
  (state) => state.status === 'authenticated' && state.user !== null,
);
export const selectAuthBusy = createSelector(
  selectAuthState,
  (state) => state.authenticationRequestId !== null || state.restoreRequestId !== null,
);
export const selectAuthViewModel = createSelector(
  selectAuthState,
  selectAuthenticated,
  selectAuthBusy,
  (state, authenticated, busy) => ({
    user: state.user,
    status: state.status,
    expired: state.expired,
    errorKey: state.errorKey,
    authenticated,
    busy,
  }),
);
