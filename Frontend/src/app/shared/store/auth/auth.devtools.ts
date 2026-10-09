import { SavedRecipesState } from '../saved-recipes/saved-recipes.state';
import { Action } from '@ngrx/store';
import { RecipesState } from '../recipes/recipes.state';
import { AuthState } from './auth.state';
export function sanitizeAuthAction(action: Action): Action {
  const sanitized = { ...action } as Action & Record<string, unknown>;
  for (const key of [
    'credentials',
    'registration',
    'token',
    'user',
    'request',
    'result',
    'detail',
    'list',
  ]) {
    if (key in sanitized) sanitized[key] = '[redacted]';
  }
  return sanitized;
}
export function sanitizeStoreState(state: {
  auth: AuthState;
  recipes?: RecipesState;
  savedRecipes?: SavedRecipesState;
}) {
  return {
    ...state,
    ...(state.recipes
      ? { recipes: { ...state.recipes, result: state.recipes.result ? '[redacted]' : null } }
      : {}),
    ...(state.savedRecipes
      ? {
          savedRecipes: {
            ...state.savedRecipes,
            list: state.savedRecipes.list ? '[redacted]' : null,
            detail: state.savedRecipes.detail ? '[redacted]' : null,
          },
        }
      : {}),
    auth: {
      ...state.auth,
      token: state.auth.token ? '[redacted]' : null,
      user: state.auth.user ? '[redacted]' : null,
    },
  };
}
