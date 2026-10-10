import { Injectable } from '@angular/core';
export const SESSION_KEY = 'smartspoon.accessToken';
// Decoding is only for local expiry handling; /auth/me authenticates the token.
export function tokenExpiry(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && Number.isFinite(payload.exp) && payload.exp > 0
      ? payload.exp * 1000
      : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  read(): string | null {
    try {
      sessionStorage.removeItem('kochfaul.accessToken');
      return sessionStorage.getItem(SESSION_KEY);
    } catch {
      return null;
    }
  }
  write(token: string | null): void {
    try {
      if (token) sessionStorage.setItem(SESSION_KEY, token);
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* Keep a memory-only session when browser storage is unavailable. */
    }
  }
}
