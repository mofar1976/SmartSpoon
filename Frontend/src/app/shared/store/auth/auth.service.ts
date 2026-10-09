import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import { AuthResponse, Credentials, Registration, User } from '../../../shared/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  login(credentials: Credentials) {
    return this.http
      .post<AuthResponse>(this.base + '/auth/login', credentials)
      .pipe(timeout(10000));
  }
  register(registration: Registration) {
    return this.http
      .post<AuthResponse>(this.base + '/auth/register', registration)
      .pipe(timeout(10000));
  }
  me() {
    return this.http.get<User>(this.base + '/auth/me').pipe(timeout(10000));
  }
}
