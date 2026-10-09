import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { RecipeRequest } from '../../../features/recipes/recipe.models';
import { TranslationKey } from '../../../core/i18n/translation-key';
import { RecipesActions } from './recipes.actions';
import {
  selectRecipeResult,
  selectRecipesBusy,
  selectRecipesState,
  selectRecipesViewModel,
} from './recipes.selectors';
import { RecipesState } from './recipes.state';
@Injectable({ providedIn: 'root' })
export class RecipesFacade {
  private readonly store = inject(Store);
  private requestId = 0;
  readonly state$ = this.store.select(selectRecipesState);
  readonly vm$ = this.store.select(selectRecipesViewModel);
  readonly result$ = this.store.select(selectRecipeResult);
  readonly busy$ = this.store.select(selectRecipesBusy);
  snapshot(): RecipesState {
    let state!: RecipesState;
    this.state$.pipe(take(1)).subscribe((value) => {
      state = value;
    });
    return state;
  }
  generate(request: RecipeRequest): void {
    if (this.snapshot().requestId !== null) return;
    this.store.dispatch(RecipesActions.generateRequested({ request, requestId: ++this.requestId }));
  }
  setPurchased(productId: string, purchased: boolean): void {
    this.store.dispatch(RecipesActions.purchasedChanged({ productId, purchased }));
  }
  setError(errorKey: TranslationKey | null): void {
    this.store.dispatch(RecipesActions.errorSet({ errorKey }));
  }
  cancel(): void {
    this.store.dispatch(RecipesActions.cancel());
  }
  reset(): void {
    this.store.dispatch(RecipesActions.reset());
  }
}
