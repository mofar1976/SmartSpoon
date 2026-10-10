import { createFeatureSelector, createSelector } from '@ngrx/store';
import { PantryState } from './pantry-recipes.state';
export const selectPantryState = createFeatureSelector<PantryState>('pantryRecipes');
export const selectPantryViewModel = createSelector(selectPantryState, (s) => ({
  ...s,
  busy: s.operation !== null,
}));
