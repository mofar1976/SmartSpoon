import { createReducer, on } from '@ngrx/store';
import { SupermarketsActions } from './supermarkets.actions';
import { initialSupermarketsState } from './supermarkets.state';
export const supermarketsReducer = createReducer(
  initialSupermarketsState,
  on(SupermarketsActions.loadRequested, (state) => ({
    ...state,
    status: 'loading' as const,
    errorKey: null,
  })),
  on(SupermarketsActions.loadSucceeded, (state, { items }) => ({
    ...state,
    items,
    status: 'loaded' as const,
    errorKey: items.length ? null : ('errors.marketsEmpty' as const),
  })),
  on(SupermarketsActions.loadFailed, (state, { errorKey }) => ({
    ...state,
    items: [],
    status: 'error' as const,
    errorKey,
  })),
  on(SupermarketsActions.reset, () => initialSupermarketsState),
);
