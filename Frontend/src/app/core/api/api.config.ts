import { InjectionToken } from '@angular/core';

// Relative URL: dev proxy and production reverse proxy keep requests same-origin.
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
