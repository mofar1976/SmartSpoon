import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../core/api/api.config';
import { Market, RecipeRequest, RecipeResult } from './recipe.models';
@Injectable({ providedIn: 'root' })
export class RecipeApi {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  supermarkets() {
    return this.http.get<Market[]>(this.base + '/products/supermarkets').pipe(timeout(10000));
  }
  generate(request: RecipeRequest) {
    return this.http
      .post<RecipeResult>(this.base + '/recipes/generate', request)
      .pipe(timeout(70000));
  }
}
