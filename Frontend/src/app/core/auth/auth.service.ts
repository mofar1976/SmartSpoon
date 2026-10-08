import { Injectable, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from '../../features/auth/auth-api';
import { AuthResponse, Credentials, Registration } from '../../shared/models';
import { SessionStore } from './session-store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly session = inject(SessionStore);
  private readonly api = inject(AuthApi);
  private readonly router = inject(Router);
  private restoration: Promise<boolean> | null = null;

  constructor() {
    effect(() => {
      if (
        this.session.expired() &&
        (this.router.url.startsWith('/rezepte') || this.router.url.startsWith('/gespeichert'))
      ) {
        void this.router.navigate(['/anmelden'], {
          queryParams: { reason: 'expired', returnUrl: this.router.url },
        });
      }
    });
  }

  restore(): Promise<boolean> {
    if (this.session.authenticated()) return Promise.resolve(true);
    if (this.restoration) return this.restoration;
    const token = this.session.token();
    if (!token) return Promise.resolve(false);
    this.session.beginCheck();
    this.restoration = firstValueFrom(this.api.me())
      .then((user) => {
        if (this.session.token() !== token) return false;
        this.session.confirm(user);
        return true;
      })
      .catch(() => {
        if (this.session.token() === token) this.session.markUnavailable();
        return false;
      })
      .finally(() => {
        this.restoration = null;
      });
    return this.restoration;
  }

  async login(credentials: Credentials): Promise<void> {
    this.accept(await firstValueFrom(this.api.login(credentials)));
  }
  async register(registration: Registration): Promise<void> {
    this.accept(await firstValueFrom(this.api.register(registration)));
  }
  logout(): void {
    this.session.clear();
    void this.router.navigateByUrl('/');
  }

  private accept(response: AuthResponse): void {
    this.session.setToken(response.accessToken);
    if (!this.session.token()) throw new Error('Invalid session response');
    this.session.confirm(response.user);
  }
}
