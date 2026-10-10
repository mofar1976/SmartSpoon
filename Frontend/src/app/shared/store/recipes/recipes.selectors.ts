import { createFeatureSelector, createSelector } from '@ngrx/store';
import { RecipesState } from './recipes.state';
export const selectRecipesState = createFeatureSelector<RecipesState>('recipes');
export const selectRecipeResult = createSelector(selectRecipesState, (state) => state.result);
export const selectRecipesBusy = createSelector(
  selectRecipesState,
  (state) => state.requestId !== null,
);
export const selectRecipesViewModel = createSelector(
  selectRecipesState,
  selectRecipesBusy,
  (state, busy) => ({
    result: state.result,
    busy,
    errorKey: state.errorKey,
    checkedProductIds: state.checkedProductIds,
  }),
);
