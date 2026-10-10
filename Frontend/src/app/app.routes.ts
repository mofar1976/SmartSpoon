import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'titles.home',
    loadComponent: () => import('./features/home/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'anmelden',
    title: 'titles.login',
    canActivate: [guestGuard],
    data: { mode: 'login' },
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'registrieren',
    title: 'titles.register',
    canActivate: [guestGuard],
    data: { mode: 'register' },
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'rezepte',
    canActivate: [authGuard],
    title: 'titles.recipes',
    loadComponent: () =>
      import('./features/recipes/recipe-page/recipe-page').then((m) => m.RecipePage),
  },
  {
    path: 'vorrat',
    canActivate: [authGuard],
    title: 'titles.pantry',
    loadComponent: () =>
      import('./features/pantry-recipes/pantry-recipes-page/pantry-recipes-page').then(
        (m) => m.PantryRecipesPage,
      ),
  },
  {
    path: 'gespeichert',
    canActivate: [authGuard],
    title: 'titles.saved',
    loadComponent: () =>
      import('./features/saved-recipes/saved-recipes-page/saved-recipes-page').then(
        (m) => m.SavedRecipesPage,
      ),
  },
  {
    path: 'gespeichert/:id',
    canActivate: [authGuard],
    title: 'titles.savedDetail',
    loadComponent: () =>
      import('./features/saved-recipes/saved-recipes-page/saved-recipes-page').then(
        (m) => m.SavedRecipesPage,
      ),
  },
  {
    path: '**',
    title: 'titles.notFound',
    data: { kind: 'not-found' },
    loadComponent: () => import('./shared/ui/up-coming/upcoming-page').then((m) => m.UpcomingPage),
  },
];
