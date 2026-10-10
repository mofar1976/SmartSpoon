import { Injectable, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { take } from 'rxjs';
import { SupermarketsActions } from './supermarkets.actions';
import {
  selectSupermarkets,
  selectSupermarketsState,
  selectSupermarketsViewModel,
} from './supermarkets.selectors';
@Injectable({ providedIn: 'root' })
export class SupermarketsFacade {
  private readonly store = inject(Store);
  readonly items$ = this.store.select(selectSupermarkets);
  readonly vm$ = this.store.select(selectSupermarketsViewModel);
  load(retry = false): void {
    this.store
      .select(selectSupermarketsState)
      .pipe(take(1))
      .subscribe((state) => {
        if (state.status === 'loading' || (state.status === 'loaded' && !retry)) return;
        this.store.dispatch(SupermarketsActions.loadRequested());
      });
  }
}
