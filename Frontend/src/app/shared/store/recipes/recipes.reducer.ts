import { createReducer, on } from '@ngrx/store';
import { RecipesActions } from './recipes.actions';
import { initialRecipesState } from './recipes.state';
export const recipesReducer = createReducer(
  initialRecipesState,
  on(RecipesActions.generateRequested, (state, { requestId }) =>
    state.requestId !== null ? state : { ...initialRecipesState, requestId },
  ),
  on(RecipesActions.generateSucceeded, (state, { requestId, result }) =>
    state.requestId === requestId ? { ...state, result, requestId: null, errorKey: null } : state,
  ),
  on(RecipesActions.generateFailed, (state, { requestId, errorKey }) =>
    state.requestId === requestId ? { ...state, requestId: null, errorKey } : state,
  ),
  on(RecipesActions.purchasedChanged, (state, { productId, purchased }) => {
    if (!state.result?.shoppingList.some((item) => item.product.id === productId)) return state;
    return {
      ...state,
      checkedProductIds: purchased
        ? [...new Set([...state.checkedProductIds, productId])]
        : state.checkedProductIds.filter((id) => id !== productId),
    };
  }),
  on(RecipesActions.errorSet, (state, { errorKey }) => ({ ...state, errorKey })),
  on(RecipesActions.cancel, (state) =>
    state.requestId === null
      ? state
      : { ...state, requestId: null, errorKey: 'errors.recipeInterrupted' as const },
  ),
  on(RecipesActions.reset, () => initialRecipesState),
);
