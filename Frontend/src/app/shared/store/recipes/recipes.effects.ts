import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  of,
  pairwise,
  takeUntil,
  withLatestFrom,
} from 'rxjs';
import { recipeErrorKey } from '../../../features/recipes/recipe-errors';
import { selectAuthState, selectToken } from '../auth/auth.selectors';
import { AuthActions } from '../auth/auth.actions';
import { RecipesActions } from './recipes.actions';
import { RecipesService } from './recipes.service';
@Injectable()
export class RecipesEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly service = inject(RecipesService);
  readonly generate$ = createEffect(() =>
    this.actions$.pipe(
      ofType(RecipesActions.generateRequested),
      withLatestFrom(this.store.select(selectAuthState)),
      exhaustMap(([{ requestId, request }, auth]) => {
        if (auth.status !== 'authenticated')
          return of(
            RecipesActions.generateFailed({ requestId, errorKey: 'errors.sessionExpired' }),
          );
        return this.service.generate(request).pipe(
          map((result) => RecipesActions.generateSucceeded({ requestId, result })),
          catchError((error) =>
            of(RecipesActions.generateFailed({ requestId, errorKey: recipeErrorKey(error) })),
          ),
          takeUntil(this.actions$.pipe(ofType(RecipesActions.cancel, RecipesActions.reset))),
        );
      }),
    ),
  );
  readonly sessionChanged$ = createEffect(() =>
    this.store.select(selectToken).pipe(
      distinctUntilChanged(),
      pairwise(),
      filter(([previous, current]) => previous !== current),
      map(() => RecipesActions.reset()),
    ),
  );
  readonly logout$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.logout),
      map(() => RecipesActions.reset()),
    ),
  );
}
