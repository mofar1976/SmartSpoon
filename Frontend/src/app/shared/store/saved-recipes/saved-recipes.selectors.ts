import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SavedRecipesState } from './saved-recipes.state';
export const selectSavedRecipesState = createFeatureSelector<SavedRecipesState>('savedRecipes');
export const selectSavedRecipesViewModel = createSelector(selectSavedRecipesState, (state) => ({
  list: state.list,
  detail: state.detail,
  checkedProductIds: state.checkedProductIds,
  loading: state.loadRequestId !== null,
  deleting: state.deleteRequestId !== null,
  errorKey: state.errorKey,
  deleteErrorKey: state.deleteErrorKey,
}));
export const selectSaveViewModel = createSelector(selectSavedRecipesState, (state) => ({
  busy: state.saveRequestId !== null,
  savedId: state.savedId,
  savedTitle: state.savedTitle,
  errorKey: state.saveErrorKey,
}));
export const selectDeletedId = createSelector(selectSavedRecipesState, (state) => state.deletedId);
