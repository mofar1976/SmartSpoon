import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import { RecipeRequest, RecipeResult } from '../../../features/recipes/recipe.models';
@Injectable({ providedIn: 'root' })
export class RecipesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  generate(request: RecipeRequest) {
    return this.http
      .post<RecipeResult>(this.base + '/recipes/generate', request)
      .pipe(timeout(70000));
  }
}
