import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, exhaustMap, filter, map, of, takeUntil, withLatestFrom } from 'rxjs';
import { SupermarketsService } from './supermarkets.service';
import { AuthActions } from '../auth/auth.actions';
import { selectAuthState } from '../auth/auth.selectors';
import { SupermarketsActions } from './supermarkets.actions';
@Injectable()
export class SupermarketsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(SupermarketsService);
  private readonly store = inject(Store);
  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SupermarketsActions.loadRequested),
      exhaustMap(() =>
        this.api.list().pipe(
          map((items) => SupermarketsActions.loadSucceeded({ items })),
          catchError(() => of(SupermarketsActions.loadFailed({ errorKey: 'errors.marketsLoad' }))),
          takeUntil(this.actions$.pipe(ofType(SupermarketsActions.reset))),
        ),
      ),
    ),
  );
  readonly reset$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout, AuthActions.sessionExpired),
      withLatestFrom(this.store.select(selectAuthState)),
      filter(([action, state]) => action.type === AuthActions.logout.type || state.expired),
      map(() => SupermarketsActions.reset()),
    ),
  );
}
