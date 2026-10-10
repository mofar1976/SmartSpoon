import { createReducer, on } from '@ngrx/store';
import { SavedRecipesActions as A } from './saved-recipes.actions';
import { isPantryResult } from '../../../features/saved-recipes/saved-recipes.models';
import { initialSavedRecipesState } from './saved-recipes.state';
export const savedRecipesReducer = createReducer(
  initialSavedRecipesState,
  on(A.loadRequested, (state, { requestId }) => ({
    ...state,
    list: null,
    detail: null,
    checkedProductIds: [],
    checkedItemIds: [],
    loadRequestId: requestId,
    deleteRequestId: null,
    errorKey: null,
    deleteErrorKey: null,
    deletedId: null,
  })),
  on(A.listLoaded, (state, { requestId, list }) =>
    state.loadRequestId === requestId ? { ...state, list, loadRequestId: null } : state,
  ),
  on(A.detailLoaded, (state, { requestId, detail }) =>
    state.loadRequestId === requestId
      ? {
          ...state,
          detail,
          checkedProductIds: [...detail.checkedProductIds],
          checkedItemIds: [...(detail.checkedItemIds ?? [])],
          loadRequestId: null,
        }
      : state,
  ),
  on(A.loadFailed, (state, { requestId, errorKey }) =>
    state.loadRequestId === requestId ? { ...state, loadRequestId: null, errorKey } : state,
  ),
  on(A.saveRequested, (state, { requestId, source }) => ({
    ...state,
    saveRequestId: requestId,
    saveSource: source,
    savedId: null,
    savedTitle: null,
    saveErrorKey: null,
  })),
  on(A.saveSucceeded, (state, { requestId, id, title }) =>
    state.saveRequestId === requestId
      ? { ...state, saveRequestId: null, savedId: id, savedTitle: title }
      : state,
  ),
  on(A.saveFailed, (state, { requestId, errorKey }) =>
    state.saveRequestId === requestId
      ? { ...state, saveRequestId: null, saveErrorKey: errorKey }
      : state,
  ),
  on(A.saveErrorSet, (state, { errorKey, source }) => ({
    ...state,
    saveSource: source,
    saveErrorKey: errorKey,
  })),
  on(A.deleteRequested, (state, { requestId }) => ({
    ...state,
    deleteRequestId: requestId,
    deleteErrorKey: null,
    deletedId: null,
  })),
  on(A.deleteSucceeded, (state, { requestId, id }) =>
    state.deleteRequestId === requestId
      ? {
          ...state,
          deleteRequestId: null,
          deletedId: id,
          detail: state.detail?.id === id ? null : state.detail,
          checkedProductIds: state.detail?.id === id ? [] : state.checkedProductIds,
          checkedItemIds: state.detail?.id === id ? [] : state.checkedItemIds,
          savedId: state.savedId === id ? null : state.savedId,
          savedTitle: state.savedId === id ? null : state.savedTitle,
        }
      : state,
  ),
  on(A.deleteFailed, (state, { requestId, errorKey }) =>
    state.deleteRequestId === requestId
      ? { ...state, deleteRequestId: null, deleteErrorKey: errorKey }
      : state,
  ),
  on(A.purchasedChanged, (state, { productId, purchased }) =>
    !state.detail ||
    isPantryResult(state.detail.result) ||
    !state.detail.result.shoppingList.some((item) => item.product.id === productId)
      ? state
      : {
          ...state,
          checkedProductIds: purchased
            ? [...new Set([...state.checkedProductIds, productId])]
            : state.checkedProductIds.filter((id) => id !== productId),
        },
  ),
  on(A.pantryPurchasedChanged, (state, { itemId, purchased }) =>
    !state.detail ||
    !isPantryResult(state.detail.result) ||
    !state.detail.result.recipes.some((recipe) =>
      recipe.shoppingList.some((item) => item.id === itemId),
    )
      ? state
      : {
          ...state,
          checkedItemIds: purchased
            ? [...new Set([...state.checkedItemIds, itemId])]
            : state.checkedItemIds.filter((id) => id !== itemId),
        },
  ),
  on(A.clearDeleteError, (state) => ({ ...state, deleteErrorKey: null })),
  on(A.clearView, (state) => ({
    ...state,
    list: null,
    detail: null,
    checkedProductIds: [],
    checkedItemIds: [],
    loadRequestId: null,
    deleteRequestId: null,
    errorKey: null,
    deleteErrorKey: null,
    deletedId: null,
  })),
  on(A.clearSave, (state, { source }) =>
    state.saveSource !== source
      ? state
      : {
          ...state,
          saveSource: null,
          saveRequestId: null,
          saveErrorKey: null,
          savedId: null,
          savedTitle: null,
        },
  ),
  on(A.reset, () => initialSavedRecipesState),
);
