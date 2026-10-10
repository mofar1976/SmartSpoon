import { createFeatureSelector, createSelector } from '@ngrx/store';
import { SavedRecipesState } from './saved-recipes.state';
export const selectSavedRecipesState = createFeatureSelector<SavedRecipesState>('savedRecipes');
export const selectSavedRecipesViewModel = createSelector(selectSavedRecipesState, (state) => ({
  list: state.list,
  detail: state.detail,
  checkedProductIds: state.checkedProductIds,
  checkedItemIds: state.checkedItemIds,
  loading: state.loadRequestId !== null,
  deleting: state.deleteRequestId !== null,
  errorKey: state.errorKey,
  deleteErrorKey: state.deleteErrorKey,
}));
function saveViewModel(source: 'market' | 'pantry') {
  return createSelector(selectSavedRecipesState, (state) => ({
    busy: state.saveRequestId !== null,
    savedId: state.saveSource === source ? state.savedId : null,
    savedTitle: state.saveSource === source ? state.savedTitle : null,
    errorKey: state.saveSource === source ? state.saveErrorKey : null,
  }));
}
export const selectSaveViewModel = saveViewModel('market');
export const selectPantrySaveViewModel = saveViewModel('pantry');
export const selectDeletedId = createSelector(selectSavedRecipesState, (state) => state.deletedId);
