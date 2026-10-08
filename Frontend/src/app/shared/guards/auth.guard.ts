import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

export function safeReturnUrl(value: string | null): string {
  return value === '/rezepte' ||
    value === '/gespeichert' ||
    /^\/gespeichert\/[a-f\d]{24}$/i.test(value ?? '')
    ? value!
    : '/rezepte';
}

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  // A failed startup check is retried explicitly from the login screen.
  if (auth.session.status() !== 'unavailable' && (await auth.restore())) return true;
  return router.createUrlTree(['/anmelden'], {
    queryParams: {
      returnUrl: safeReturnUrl(state.url),
      ...(auth.session.expired() ? { reason: 'expired' } : {}),
      ...(auth.session.status() === 'unavailable' ? { reason: 'connection' } : {}),
    },
  });
};
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.session.authenticated() ? router.createUrlTree(['/rezepte']) : true;
};
