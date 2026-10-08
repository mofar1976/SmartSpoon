import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { User } from '../../shared/models';

export const SESSION_KEY = 'kochfaul.accessToken';
export type SessionStatus = 'anonymous' | 'checking' | 'authenticated' | 'unavailable';

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
export class SessionStore implements OnDestroy {
  private readonly currentToken = signal<string | null>(null);
  private readonly currentUser = signal<User | null>(null);
  private readonly currentStatus = signal<SessionStatus>('anonymous');
  private timer?: ReturnType<typeof setTimeout>;
  readonly token = this.currentToken.asReadonly();
  readonly user = this.currentUser.asReadonly();
  readonly status = this.currentStatus.asReadonly();
  readonly expired = signal(false);
  readonly authenticated = computed(
    () => this.status() === 'authenticated' && this.user() !== null,
  );

  constructor() {
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(SESSION_KEY);
    } catch {
      /* Memory-only session if storage is blocked. */
    }
    if (saved) this.setToken(saved);
  }

  setToken(token: string): void {
    const expiry = tokenExpiry(token);
    if (!expiry || expiry <= Date.now()) {
      this.clear(true);
      return;
    }
    this.cancelTimer();
    this.currentToken.set(token);
    this.currentUser.set(null);
    this.currentStatus.set('checking');
    this.expired.set(false);
    try {
      sessionStorage.setItem(SESSION_KEY, token);
    } catch {
      /* Remain usable in memory. */
    }
    this.scheduleExpiry(expiry);
  }

  confirm(user: User): void {
    if (!this.token()) return;
    this.currentUser.set(user);
    this.currentStatus.set('authenticated');
  }

  markUnavailable(): void {
    this.currentUser.set(null);
    this.currentStatus.set('unavailable');
  }
  beginCheck(): void {
    this.currentStatus.set('checking');
  }

  clear(expired = false): void {
    this.cancelTimer();
    this.currentToken.set(null);
    this.currentUser.set(null);
    this.currentStatus.set('anonymous');
    this.expired.set(expired);
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      /* No persistent session. */
    }
  }

  private scheduleExpiry(expiry: number): void {
    const delay = expiry - Date.now();
    if (delay <= 0) {
      this.clear(true);
      return;
    }
    this.timer = setTimeout(() => this.scheduleExpiry(expiry), Math.min(delay, 2_147_483_647));
  }
  private cancelTimer(): void {
    if (this.timer !== undefined) clearTimeout(this.timer);
  }
  ngOnDestroy(): void {
    this.cancelTimer();
  }
}
