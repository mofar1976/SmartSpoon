import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    title: 'Kochfaul · Gut essen. Weniger ausgeben.',
    loadComponent: () => import('./features/home/home-page/home-page').then((m) => m.HomePage),
  },
  {
    path: 'anmelden',
    title: 'Anmelden · Kochfaul',
    canActivate: [guestGuard],
    data: { mode: 'login' },
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'registrieren',
    title: 'Registrieren · Kochfaul',
    canActivate: [guestGuard],
    data: { mode: 'register' },
    loadComponent: () => import('./features/auth/auth-page/auth-page').then((m) => m.AuthPage),
  },
  {
    path: 'rezepte',
    canActivate: [authGuard],
    title: 'Deine Rezepte · Kochfaul',
    loadComponent: () =>
      import('./features/recipes/recipe-page/recipe-page').then((m) => m.RecipePage),
  },
  {
    path: 'gespeichert',
    canActivate: [authGuard],
    title: 'Gespeicherte Auswahlen · Kochfaul',
    loadComponent: () =>
      import('./features/saved-recipes/saved-recipes-page/saved-recipes-page').then(
        (m) => m.SavedRecipesPage,
      ),
  },
  {
    path: 'gespeichert/:id',
    canActivate: [authGuard],
    title: 'Gespeicherte Auswahl · Kochfaul',
    loadComponent: () =>
      import('./features/saved-recipes/saved-recipes-page/saved-recipes-page').then(
        (m) => m.SavedRecipesPage,
      ),
  },
  {
    path: '**',
    title: 'Seite nicht gefunden · Kochfaul',
    data: { kind: 'not-found' },
    loadComponent: () => import('./shared/ui/up-coming/upcoming-page').then((m) => m.UpcomingPage),
  },
];
