import { Injectable, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import {
  Observable,
  catchError,
  distinctUntilChanged,
  exhaustMap,
  filter,
  map,
  of,
  pairwise,
  switchMap,
  takeUntil,
  withLatestFrom,
} from 'rxjs';
import { SavedRecipe, SavedRecipeList } from '../../../features/saved-recipes/saved-recipes.models';
import { savedRecipesErrorKey } from '../../../features/saved-recipes/saved-recipes-errors';
import { selectToken } from '../auth/auth.selectors';
import { AuthActions } from '../auth/auth.actions';
import { selectRecipeResult } from '../recipes/recipes.selectors';
import { selectSavedRecipesState } from './saved-recipes.selectors';
import { SavedRecipesActions as A } from './saved-recipes.actions';
import { SavedRecipesService } from './saved-recipes.service';
@Injectable()
export class SavedRecipesEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly service = inject(SavedRecipesService);
  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.loadRequested),
      switchMap(({ requestId, id, offset }) => {
        if (id && !/^[a-f\d]{24}$/i.test(id))
          return of(A.loadFailed({ requestId, errorKey: 'errors.savedInvalidId' }));
        const operation: Observable<SavedRecipe | SavedRecipeList> = id
          ? this.service.detail(id)
          : this.service.list(offset);
        return operation.pipe(
          map((value) => {
            if ('result' in value) return A.detailLoaded({ requestId, detail: value });
            if (
              !value.items.length &&
              value.total > 0 &&
              value.offset >= value.total &&
              value.limit > 0
            )
              return A.loadRequested({
                requestId: crypto.randomUUID(),
                id: null,
                offset: Math.floor((value.total - 1) / value.limit) * value.limit,
              });
            return A.listLoaded({ requestId, list: value });
          }),
          catchError((error) =>
            of(A.loadFailed({ requestId, errorKey: savedRecipesErrorKey(error, 'load') })),
          ),
          takeUntil(this.actions$.pipe(ofType(A.reset, A.clearView))),
        );
      }),
    ),
  );
  readonly save$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.saveRequested),
      exhaustMap(({ requestId, result, title, checkedProductIds }) =>
        this.service.save(result, title, checkedProductIds).pipe(
          map((saved) => A.saveSucceeded({ requestId, id: saved.id, title: saved.title })),
          catchError((error) =>
            of(A.saveFailed({ requestId, errorKey: savedRecipesErrorKey(error, 'save') })),
          ),
          takeUntil(this.actions$.pipe(ofType(A.reset, A.clearSave))),
        ),
      ),
    ),
  );
  readonly delete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.deleteRequested),
      exhaustMap(({ requestId, id }) =>
        this.service.remove(id).pipe(
          map(() => A.deleteSucceeded({ requestId, id })),
          catchError((error) =>
            of(
              error instanceof HttpErrorResponse && error.status === 404
                ? A.deleteSucceeded({ requestId, id })
                : A.deleteFailed({ requestId, errorKey: savedRecipesErrorKey(error, 'delete') }),
            ),
          ),
          takeUntil(this.actions$.pipe(ofType(A.reset, A.clearView, A.loadRequested))),
        ),
      ),
    ),
  );
  readonly reloadAfterDelete$ = createEffect(() =>
    this.actions$.pipe(
      ofType(A.deleteSucceeded),
      withLatestFrom(this.store.select(selectSavedRecipesState)),
      filter(([action, state]) => state.deletedId === action.id && state.list !== null),
      map(([, state]) => {
        const list = state.list!;
        return A.loadRequested({
          requestId: crypto.randomUUID(),
          id: null,
          offset:
            list.items.length === 1 && list.offset > 0
              ? Math.max(0, list.offset - list.limit)
              : list.offset,
        });
      }),
    ),
  );
  readonly clearSave$ = createEffect(() =>
    this.store.select(selectRecipeResult).pipe(
      distinctUntilChanged(),
      map(() => A.clearSave()),
    ),
  );
  readonly sessionChanged$ = createEffect(() =>
    this.store.select(selectToken).pipe(
      distinctUntilChanged(),
      pairwise(),
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
