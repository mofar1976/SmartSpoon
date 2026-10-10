import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { defer, filter, map, of, take } from 'rxjs';
import { Credentials, Registration } from '../../models';
import { safeReturnUrl } from '../../guards/return-url';
import { AuthActions } from './auth.actions';
import {
  selectAuthState,
  selectAuthViewModel,
  selectAuthenticated,
  selectUser,
} from './auth.selectors';
import { AuthState } from './auth.state';
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly store = inject(Store);
  private requestId = 0;
  readonly state$ = this.store.select(selectAuthState);
  readonly vm$ = this.store.select(selectAuthViewModel);
  readonly authenticated$ = this.store.select(selectAuthenticated);
  readonly user$ = this.store.select(selectUser);
  // Imperative consumers (HTTP interceptors and the not-yet-migrated recipe services)
  // read the same Store state. No second session state is maintained here.
  snapshot(): AuthState {
    let state!: AuthState;
    this.state$.pipe(take(1)).subscribe((value) => {
      state = value;
    });
    return state;
  }
  restore() {
    return defer(() => {
      if (!this.snapshot().initialized) this.store.dispatch(AuthActions.initialize());
      const state = this.snapshot();
      if (state.status === 'authenticated') return of(true);
      if (!state.token) return of(false);
      if (state.restoreRequestId === null)
        this.store.dispatch(AuthActions.restoreRequested({ requestId: ++this.requestId }));
      return this.state$.pipe(
        filter((value) => value.restoreRequestId === null),
        take(1),
        map((value) => value.status === 'authenticated'),
      );
    });
  }
  login(credentials: Credentials, returnUrl: string): void {
    if (this.snapshot().authenticationRequestId !== null) return;
    this.store.dispatch(
      AuthActions.loginRequested({
        credentials,
        returnUrl: safeReturnUrl(returnUrl),
        requestId: ++this.requestId,
      }),
    );
  }
  register(registration: Registration, returnUrl: string): void {
    if (this.snapshot().authenticationRequestId !== null) return;
    this.store.dispatch(
      AuthActions.registerRequested({
        registration,
        returnUrl: safeReturnUrl(returnUrl),
        requestId: ++this.requestId,
      }),
    );
  }
  logout(): void {
    this.store.dispatch(AuthActions.logout());
  }
  expire(token: string): void {
    this.store.dispatch(AuthActions.sessionExpired({ token }));
  }
  clearForm(): void {
    this.store.dispatch(AuthActions.clearForm());
  }
}
