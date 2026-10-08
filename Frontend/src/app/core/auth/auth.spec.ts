import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  HttpErrorResponse,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SessionStore, SESSION_KEY } from './session-store';
import { AuthService } from './auth.service';
import { authInterceptor } from '../../shared/interceptors/auth.interceptor';
import { authGuard, safeReturnUrl } from '../../shared/guards/auth.guard';

const user = { id: 'test-user', username: 'student_01', birthDate: '2000-05-15' };
const token = (seconds = 3600, suffix = 'signature') =>
  'header.' + btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + seconds })) + '.' + suffix;
let http: HttpTestingController;
let session: SessionStore;
let auth: AuthService;

beforeEach(() => {
  sessionStorage.clear();
  TestBed.configureTestingModule({
    providers: [
      provideHttpClient(withInterceptors([authInterceptor])),
      provideHttpClientTesting(),
      provideRouter([]),
    ],
  });
  http = TestBed.inject(HttpTestingController);
  session = TestBed.inject(SessionStore);
  auth = TestBed.inject(AuthService);
});
afterEach(() => {
  http.verify();
  TestBed.resetTestingModule();
  sessionStorage.clear();
  vi.useRealTimers();
});

describe('authentication lifecycle', () => {
  it('login sends only credentials and stores a tab session', async () => {
    const result = auth.login({ username: user.username, password: 'password123' });
    const request = http.expectOne('/api/auth/login');
    expect(request.request.headers.has('Authorization')).toBe(false);
    expect(request.request.body).toEqual({ username: user.username, password: 'password123' });
    const accessToken = token();
    request.flush({ accessToken, user, tokenType: 'Bearer', expiresIn: 3600 });
    await result;
    expect(session.authenticated()).toBe(true);
    expect(sessionStorage.getItem(SESSION_KEY)).toBe(accessToken);
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
  it('restores a saved session through /me and shares concurrent checks', async () => {
    session.setToken(token());
    const a = auth.restore();
    const b = auth.restore();
    const request = http.expectOne('/api/auth/me');
    expect(request.request.headers.get('Authorization')).toBe('Bearer ' + session.token());
    request.flush(user);
    expect(await a).toBe(true);
    expect(await b).toBe(true);
    expect(session.user()).toEqual(user);
  });
  it('does not restore a response after logout', async () => {
    session.setToken(token());
    const result = auth.restore();
    const request = http.expectOne('/api/auth/me');
    session.clear();
    request.flush(user);
    expect(await result).toBe(false);
    expect(session.user()).toBeNull();
  });
  it('clears an invalid stored token when /me returns 401', async () => {
    session.setToken(token());
    const result = auth.restore();
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(await result).toBe(false);
    expect(session.token()).toBeNull();
    expect(session.expired()).toBe(true);
  });
  it('keeps the token on connection failure and allows a manual session retry', async () => {
    session.setToken(token());
    const saved = session.token();
    const first = auth.restore();
    http.expectOne('/api/auth/me').flush({}, { status: 503, statusText: 'Unavailable' });
    expect(await first).toBe(false);
    expect(session.status()).toBe('unavailable');
    expect(session.token()).toBe(saved);
    const second = auth.restore();
    http.expectOne('/api/auth/me').flush(user);
    expect(await second).toBe(true);
  });
  it('expires locally according to JWT exp, not the response expiresIn', () => {
    vi.useFakeTimers();
    session.setToken(token(2));
    session.confirm(user);
    vi.advanceTimersByTime(2100);
    expect(session.authenticated()).toBe(false);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
  it('logout clears the user and token and navigates home', () => {
    const navigation = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);
    session.setToken(token());
    session.confirm(user);
    auth.logout();
    expect(session.user()).toBeNull();
    expect(session.token()).toBeNull();
    expect(navigation).toHaveBeenCalledWith('/');
  });
});

describe('interceptor boundaries', () => {
  it('never sends the token to external URLs or a different API prefix', async () => {
    session.setToken(token());
    for (const url of [
      'https://other.example/api/products',
      '//other.example/api/products',
      '/api-other/products',
      '/api/../outside',
      '/api/%2e%2e/outside',
    ]) {
      const response = firstValueFrom(TestBed.inject(HttpClient).get(url));
      const request = http.expectOne(url);
      expect(request.request.headers.has('Authorization')).toBe(false);
      request.flush({});
      await response;
    }
  });
  it('a failed login does not invalidate an existing session', async () => {
    session.setToken(token());
    const saved = session.token();
    const response = auth.login({ username: 'wrong', password: 'password123' });
    const rejection = expect(response).rejects.toBeInstanceOf(HttpErrorResponse);
    http.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    await rejection;
    expect(session.token()).toBe(saved);
  });
  it('clears a current session and redirects for a protected API 401', async () => {
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    session.setToken(token());
    session.confirm(user);
    const response = firstValueFrom(TestBed.inject(HttpClient).get('/api/products'));
    const rejection = expect(response).rejects.toBeInstanceOf(HttpErrorResponse);
    http.expectOne('/api/products').flush({}, { status: 401, statusText: 'Unauthorized' });
    await rejection;
    expect(session.token()).toBeNull();
    expect(navigate).toHaveBeenCalled();
  });
  it('a late 401 cannot delete a newer session', async () => {
    session.setToken(token(3600, 'old'));
    const response = firstValueFrom(TestBed.inject(HttpClient).get('/api/products'));
    const rejection = expect(response).rejects.toBeInstanceOf(HttpErrorResponse);
    const request = http.expectOne('/api/products');
    session.setToken(token(3600, 'new'));
    session.confirm(user);
    const saved = session.token();
    request.flush({}, { status: 401, statusText: 'Unauthorized' });
    await rejection;
    expect(session.token()).toBe(saved);
    expect(session.authenticated()).toBe(true);
  });
  it('redirects unauthenticated recipe navigation to login and rejects external return URLs', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/rezepte' } as never),
    );
    expect(TestBed.inject(Router).serializeUrl(result as never)).toContain('/anmelden?returnUrl=');
    expect(safeReturnUrl('https://other.example')).toBe('/rezepte');
    expect(safeReturnUrl('//other.example')).toBe('/rezepte');
  });
});
