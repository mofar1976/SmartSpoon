import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  EMPTY,
  Observable,
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  of,
  switchMap,
  takeUntil,
  tap,
  timer,
  withLatestFrom,
} from 'rxjs';
import { AuthService } from './auth.service';
import { AuthSessionService, tokenExpiry } from './auth-session.service';
import { authErrorKey } from '../../../features/auth/auth-errors';
import { safeReturnUrl } from '../../guards/return-url';
import { AuthActions } from './auth.actions';
import { selectAuthState, selectToken } from './auth.selectors';
function expiryTimer(expiry: number): Observable<number> {
  return timer(Math.max(0, Math.min(expiry - Date.now(), 2_147_483_647))).pipe(
    switchMap(() => (expiry > Date.now() ? expiryTimer(expiry) : of(0))),
  );
}
@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly api = inject(AuthService);
  private readonly session = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly sessionEnded$ = this.actions$.pipe(
    ofType(AuthActions.logout, AuthActions.sessionExpired),
    withLatestFrom(this.store.select(selectAuthState)),
    filter(
      ([action, state]) =>
        action.type === AuthActions.logout.type || (state.expired && state.token === null),
    ),
  );
  readonly initialize$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.initialize),
      map(() => {
        const token = this.session.read();
        const expiry = token ? tokenExpiry(token) : null;
        const valid = expiry !== null && expiry > Date.now();
        return AuthActions.hydrated({ token: valid ? token : null, expired: !!token && !valid });
      }),
    ),
  );
  readonly restore$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.restoreRequested),
      withLatestFrom(this.store.select(selectAuthState)),
      exhaustMap(([{ requestId }, state]) => {
        const token = state.token;
        if (!token) return EMPTY;
        return this.api.me().pipe(
          map((user) => AuthActions.restoreSucceeded({ requestId, token, user })),
          catchError(() => of(AuthActions.restoreFailed({ requestId, token }))),
          takeUntil(this.sessionEnded$),
          takeUntil(
            this.actions$.pipe(
              ofType(AuthActions.authenticationSucceeded),
              withLatestFrom(this.store.select(selectAuthState)),
              filter(
                ([action, state]) =>
                  state.status === 'authenticated' && state.token === action.token,
              ),
            ),
          ),
        );
      }),
    ),
  );
  readonly authenticate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.loginRequested, AuthActions.registerRequested),
      exhaustMap((action) => {
        const registering = 'registration' in action;
        const operation = registering
          ? this.api.register(action.registration)
          : this.api.login(action.credentials);
        return operation.pipe(
          map((response) => {
            const expiry = tokenExpiry(response.accessToken);
            if (!expiry || expiry <= Date.now()) throw new Error('Invalid session response');
            return AuthActions.authenticationSucceeded({
              requestId: action.requestId,
              token: response.accessToken,
              user: response.user,
              returnUrl: action.returnUrl,
            });
          }),
          catchError((error) =>
            of(
              AuthActions.authenticationFailed({
                requestId: action.requestId,
                errorKey: authErrorKey(error, registering),
              }),
            ),
          ),
          takeUntil(this.sessionEnded$),
          takeUntil(this.actions$.pipe(ofType(AuthActions.clearForm))),
        );
      }),
    ),
  );
  readonly persist$ = createEffect(
    () =>
      this.store.select(selectAuthState).pipe(
        filter((state) => state.initialized),
        map((state) => state.token),
        distinctUntilChanged(),
        tap((token) => this.session.write(token)),
      ),
    { dispatch: false },
  );
  readonly expiry$ = createEffect(() =>
    this.store.select(selectToken).pipe(
      switchMap((token) => {
        const expiry = token ? tokenExpiry(token) : null;
        return token && expiry
          ? expiryTimer(expiry).pipe(map(() => AuthActions.sessionExpired({ token })))
          : EMPTY;
      }),
    ),
  );
  readonly navigation$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.authenticationSucceeded, AuthActions.logout, AuthActions.sessionExpired),
        withLatestFrom(this.store.select(selectAuthState)),
        tap(([action, state]) => {
          if (
            action.type === AuthActions.authenticationSucceeded.type &&
            state.token === action.token &&
            state.status === 'authenticated'
          ) {
            void this.router.navigateByUrl(safeReturnUrl(action.returnUrl));
          } else if (action.type === AuthActions.logout.type) {
            void this.router.navigateByUrl('/');
          } else if (
            action.type === AuthActions.sessionExpired.type &&
            state.expired &&
            (this.router.url.startsWith('/rezepte') ||
              this.router.url.startsWith('/gespeichert') ||
              this.router.url.startsWith('/vorrat'))
          ) {
            void this.router.navigate(['/anmelden'], {
              queryParams: { reason: 'expired', returnUrl: safeReturnUrl(this.router.url) },
            });
          }
        }),
      ),
    { dispatch: false },
  );
}
