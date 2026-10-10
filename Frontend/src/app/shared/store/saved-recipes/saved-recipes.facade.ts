import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { AuthFacade } from '../auth/auth.facade';
import { PantryRecipesFacade } from '../pantry-recipes/pantry-recipes.facade';
import { RecipesFacade } from '../recipes/recipes.facade';
import { SavedRecipesActions as A } from './saved-recipes.actions';
import {
  selectDeletedId,
  selectSavedRecipesState,
  selectSavedRecipesViewModel,
  selectSaveViewModel,
  selectPantrySaveViewModel,
} from './saved-recipes.selectors';
import { SavedRecipesState } from './saved-recipes.state';
@Injectable({ providedIn: 'root' })
export class SavedRecipesFacade {
  private readonly store = inject(Store);
  private readonly auth = inject(AuthFacade);
  private readonly recipes = inject(RecipesFacade);
  private readonly pantry = inject(PantryRecipesFacade);
  readonly vm$ = this.store.select(selectSavedRecipesViewModel);
  readonly pantrySaveVm$ = this.store.select(selectPantrySaveViewModel);
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
    if (state.saveRequestId !== null || (state.saveSource === 'market' && state.savedId)) return;
    if (!recipes.result?.saveProof || this.auth.snapshot().status !== 'authenticated') {
      this.store.dispatch(A.saveErrorSet({ errorKey: 'errors.savedFresh', source: 'market' }));
      return;
    }
    this.store.dispatch(
      A.saveRequested({
        requestId: crypto.randomUUID(),
        result: recipes.result,
        source: 'market',
        checkedItemIds: [],
        title: title.trim(),
        checkedProductIds: [...recipes.checkedProductIds],
      }),
    );
  }
  savePantry(title: string): void {
    const state = this.snapshot(),
      pantry = this.pantry.snapshot();
    if (state.saveRequestId !== null || (state.saveSource === 'pantry' && state.savedId)) return;
    if (!pantry.result?.saveProof || this.auth.snapshot().status !== 'authenticated') {
      this.store.dispatch(A.saveErrorSet({ source: 'pantry', errorKey: 'errors.savedFresh' }));
      return;
    }
    this.store.dispatch(
      A.saveRequested({
        requestId: crypto.randomUUID(),
        source: 'pantry',
        result: pantry.result,
        title: title.trim(),
        checkedProductIds: [],
        checkedItemIds: [...pantry.checkedItemIds],
      }),
    );
  }
  setPantryPurchased(itemId: string, purchased: boolean): void {
    this.store.dispatch(A.pantryPurchasedChanged({ itemId, purchased }));
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
