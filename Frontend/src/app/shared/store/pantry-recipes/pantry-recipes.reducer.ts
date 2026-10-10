import { createReducer, on } from '@ngrx/store';
import { PantryActions as A } from './pantry-recipes.actions';
import { initialPantryState } from './pantry-recipes.state';
export const pantryReducer = createReducer(
  initialPantryState,
  on(A.analysisRequested, (s, a) =>
    s.operation
      ? s
      : {
          ...s,
          operation: 'analysis' as const,
          requestId: a.requestId,
          errorKey: null,
          result: null,
          checkedItemIds: [],
        },
  ),
  on(A.generationRequested, (s, a) =>
    s.operation
      ? s
      : {
          ...s,
          operation: 'generation' as const,
          requestId: a.requestId,
          errorKey: null,
          result: null,
          checkedItemIds: [],
        },
  ),
  on(A.analysisSucceeded, (s, a) =>
    s.requestId !== a.requestId
      ? s
      : { ...s, recognition: a.recognition, operation: null, requestId: null },
  ),
  on(A.generationSucceeded, (s, a) =>
    s.requestId !== a.requestId
      ? s
      : { ...s, result: a.result, checkedItemIds: [], operation: null, requestId: null },
  ),
  on(A.failed, (s, a) =>
    s.requestId !== a.requestId
      ? s
      : { ...s, errorKey: a.errorKey, operation: null, requestId: null },
  ),
  on(A.cancel, (s) => ({ ...s, operation: null, requestId: null, errorKey: null })),
  on(A.draftChanged, (s) => ({ ...s, result: null, checkedItemIds: [], errorKey: null })),
  on(A.purchasedChanged, (s, { itemId, purchased }) =>
    !s.result?.recipes.some((recipe) => recipe.shoppingList.some((item) => item.id === itemId))
      ? s
      : {
          ...s,
          checkedItemIds: purchased
            ? [...new Set([...s.checkedItemIds, itemId])]
            : s.checkedItemIds.filter((id) => id !== itemId),
        },
  ),
  on(A.reset, () => initialPantryState),
);
