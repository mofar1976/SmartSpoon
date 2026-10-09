import { SavedRecipesEffects } from './saved-recipes/saved-recipes.effects';
import { savedRecipesReducer } from './saved-recipes/saved-recipes.reducer';
import { RecipesEffects } from './recipes/recipes.effects';
import { recipesReducer } from './recipes/recipes.reducer';
import { SupermarketsEffects } from './supermarkets/supermarkets.effects';
import { supermarketsReducer } from './supermarkets/supermarkets.reducer';
import { sanitizeAuthAction, sanitizeStoreState } from './auth/auth.devtools';
import { isDevMode, makeEnvironmentProviders } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { AuthEffects } from './auth/auth.effects';
import { authReducer } from './auth/auth.reducer';
export function provideAppStore() {
  return makeEnvironmentProviders([
    provideStore(
      {
        auth: authReducer,
        supermarkets: supermarketsReducer,
        recipes: recipesReducer,
        savedRecipes: savedRecipesReducer,
      },
      {
        runtimeChecks: {
          strictStateImmutability: true,
          strictActionImmutability: true,
          strictStateSerializability: true,
          strictActionSerializability: true,
        },
      },
    ),
    provideEffects(AuthEffects, SupermarketsEffects, RecipesEffects, SavedRecipesEffects),
    ...(isDevMode()
      ? [
          provideStoreDevtools({
            maxAge: 25,
            actionSanitizer: sanitizeAuthAction,
            stateSanitizer: sanitizeStoreState,
            trace: false,
          }),
        ]
      : []),
  ]);
}
