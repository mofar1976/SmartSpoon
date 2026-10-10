import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SupermarketsState } from './supermarkets.state';
export const selectSupermarketsState = createFeatureSelector<SupermarketsState>('supermarkets');
export const selectSupermarkets = createSelector(selectSupermarketsState, (state) => state.items);
export const selectSupermarketsViewModel = createSelector(selectSupermarketsState, (state) => ({
  items: state.items,
  loading: state.status === 'loading',
  errorKey: state.errorKey,
}));
