import { safeReturnUrl } from '../guards/auth.guard';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { SessionStore } from '../../core/auth/session-store';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const base = inject(API_BASE_URL);
  // Accept only root-relative URLs beneath our configured API boundary.
  if (
    !request.url.startsWith(base + '/') ||
    !request.url.startsWith('/') ||
    request.url.startsWith('//')
  )
    return next(request);
  const path = new URL(request.url, 'http://smartspoon.local').pathname;
  if (!path.startsWith(base + '/')) return next(request);
  if (path === base + '/auth/login' || path === base + '/auth/register') return next(request);
  const session = inject(SessionStore);
  const router = inject(Router);
  const token = session.token();
  const authenticatedRequest = token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;
  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      // A late response from an old session must not invalidate a newer login.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        token &&
        session.token() === token
      ) {
        session.clear(true);
        if (path !== base + '/auth/me') {
          void router.navigate(['/anmelden'], {
            queryParams: { reason: 'expired', returnUrl: safeReturnUrl(router.url) },
          });
        }
      }
      return throwError(() => error);
    }),
  );
};
