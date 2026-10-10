import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import { Market } from '../../../features/recipes/recipe.models';
@Injectable({ providedIn: 'root' })
export class SupermarketsService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  list() {
    return this.http.get<Market[]>(this.base + '/products/supermarkets').pipe(timeout(10000));
  }
}
