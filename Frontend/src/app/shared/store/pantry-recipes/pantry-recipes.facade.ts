import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { PantryRequest } from '../../../features/pantry-recipes/pantry-recipes.models';
import { PantryActions as A } from './pantry-recipes.actions';
import { selectPantryState, selectPantryViewModel } from './pantry-recipes.selectors';
import { PantryState } from './pantry-recipes.state';
import { PantryRecipesService } from './pantry-recipes.service';
@Injectable({ providedIn: 'root' })
export class PantryRecipesFacade {
  private readonly store = inject(Store);
  private readonly service = inject(PantryRecipesService);
  private nextId = 0;
  readonly state$ = this.store.select(selectPantryState);
  readonly vm$ = this.store.select(selectPantryViewModel);
  snapshot() {
    let state!: PantryState;
    this.state$.pipe(take(1)).subscribe((s) => (state = s));
    return state;
  }
  analyze(file: File) {
    if (this.snapshot().operation) return;
    const requestId = ++this.nextId;
    this.service.stagePhoto(requestId, file);
    this.store.dispatch(A.analysisRequested({ requestId }));
  }
  generate(request: PantryRequest) {
    if (this.snapshot().operation) return;
    this.store.dispatch(A.generationRequested({ requestId: ++this.nextId, request }));
  }
  setPurchased(itemId: string, purchased: boolean) {
    this.store.dispatch(A.purchasedChanged({ itemId, purchased }));
  }
  cancel() {
    this.store.dispatch(A.cancel());
  }
  reset() {
    this.store.dispatch(A.reset());
  }
  draftChanged() {
    this.store.dispatch(A.draftChanged());
  }
}
