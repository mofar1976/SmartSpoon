import { firstValueFrom } from 'rxjs';
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '../store/auth/auth.facade';

import { safeReturnUrl } from './return-url';
export { safeReturnUrl } from './return-url';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  // A failed startup check is retried explicitly from the login screen.
  if (auth.snapshot().status !== 'unavailable' && (await firstValueFrom(auth.restore())))
    return true;
  return router.createUrlTree(['/anmelden'], {
    queryParams: {
      returnUrl: safeReturnUrl(state.url),
      ...(auth.snapshot().expired ? { reason: 'expired' } : {}),
      ...(auth.snapshot().status === 'unavailable' ? { reason: 'connection' } : {}),
    },
  });
};
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthFacade);
  const router = inject(Router);
  return auth.snapshot().status === 'authenticated' ? router.createUrlTree(['/rezepte']) : true;
};
