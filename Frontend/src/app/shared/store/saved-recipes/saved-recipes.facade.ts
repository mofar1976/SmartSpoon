import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { RecipesFacade } from '../recipes/recipes.facade';
import { SavedRecipesActions as A } from './saved-recipes.actions';
import {
  selectDeletedId,
  selectSavedRecipesState,
  selectSavedRecipesViewModel,
  selectSaveViewModel,
} from './saved-recipes.selectors';
import { SavedRecipesState } from './saved-recipes.state';
@Injectable({ providedIn: 'root' })
export class SavedRecipesFacade {
  private readonly store = inject(Store);
  private readonly auth = inject(AuthFacade);
  private readonly recipes = inject(RecipesFacade);
  readonly vm$ = this.store.select(selectSavedRecipesViewModel);
  readonly saveVm$ = this.store.select(selectSaveViewModel);
  readonly deletedId$ = this.store.select(selectDeletedId);
  snapshot(): SavedRecipesState {
    let state!: SavedRecipesState;
    this.store
      .select(selectSavedRecipesState)
      .pipe(take(1))
      .subscribe((value) => {
        state = value;
      });
    return state;
  }
  load(id: string | null, offset = 0): void {
    if (this.auth.snapshot().status !== 'authenticated') return;
    this.store.dispatch(
      A.loadRequested({
        requestId: crypto.randomUUID(),
        id,
        offset: Math.max(0, Math.floor(offset)),
      }),
    );
  }
  save(title: string): void {
    const state = this.snapshot(),
      recipes = this.recipes.snapshot();
    if (state.saveRequestId !== null || state.savedId) return;
    if (!recipes.result?.saveProof || this.auth.snapshot().status !== 'authenticated') {
      this.store.dispatch(A.saveErrorSet({ errorKey: 'errors.savedFresh' }));
      return;
    }
    this.store.dispatch(
      A.saveRequested({
        requestId: crypto.randomUUID(),
        result: recipes.result,
        title: title.trim(),
        checkedProductIds: [...recipes.checkedProductIds],
      }),
    );
  }
  remove(id: string): void {
    if (this.snapshot().deleteRequestId !== null || this.auth.snapshot().status !== 'authenticated')
      return;
    this.store.dispatch(A.deleteRequested({ requestId: crypto.randomUUID(), id }));
  }
  setPurchased(productId: string, purchased: boolean): void {
    this.store.dispatch(A.purchasedChanged({ productId, purchased }));
  }
  clearDeleteError(): void {
    this.store.dispatch(A.clearDeleteError());
  }
  clearView(): void {
    this.store.dispatch(A.clearView());
  }
}
