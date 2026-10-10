import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  defer,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  of,
  pairwise,
  takeUntil,
  tap,
  withLatestFrom,
} from 'rxjs';
import { pantryErrorKey } from '../../../features/pantry-recipes/pantry-errors';
import { selectAuthState, selectToken } from '../auth/auth.selectors';
import { AuthActions } from '../auth/auth.actions';
import { PantryActions as A } from './pantry-recipes.actions';
import { PantryRecipesService } from './pantry-recipes.service';
import { selectPantryState } from './pantry-recipes.selectors';
@Injectable()
export class PantryRecipesEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly service = inject(PantryRecipesService);
  readonly requests$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.analysisRequested, A.generationRequested),
      withLatestFrom(this.store.select(selectAuthState), this.store.select(selectPantryState)),
      filter(([a, , s]) => a.requestId === s.requestId),
      exhaustMap(([a, auth]) =>
        defer(() => {
          if (auth.status !== 'authenticated')
            return of(A.failed({ requestId: a.requestId, errorKey: 'errors.sessionExpired' }));
          return a.type === A.analysisRequested.type
            ? this.service
                .analyze(a.requestId)
                .pipe(
                  map((recognition) =>
                    A.analysisSucceeded({ requestId: a.requestId, recognition }),
                  ),
                )
            : this.service
                .generate(a.request)
                .pipe(map((result) => A.generationSucceeded({ requestId: a.requestId, result })));
        }).pipe(
          catchError((error) =>
            of(
              A.failed({
                requestId: a.requestId,
                errorKey: pantryErrorKey(
                  error,
                  a.type === A.analysisRequested.type ? 'analysis' : 'generation',
                ),
              }),
            ),
          ),
          takeUntil(this.actions$.pipe(ofType(A.cancel, A.reset))),
        ),
      ),
    ),
  );
  readonly clearUploads$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(A.cancel, A.reset),
        tap(() => this.service.clearPhotos()),
      ),
    { dispatch: false },
  );
  readonly sessionChanged$ = createEffect(() =>
    this.store.select(selectToken).pipe(
      distinctUntilChanged(),
      pairwise(),
      filter(([p, c]) => p !== c),
      map(() => A.reset()),
    ),
  );
  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => A.reset()),
    ),
  );
}
