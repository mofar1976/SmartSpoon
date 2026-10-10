import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import {
  isPantryResult,
  SavableRecipeResult,
} from '../../../features/saved-recipes/saved-recipes.models';
import { SavedRecipe, SavedRecipeList } from '../../../features/saved-recipes/saved-recipes.models';
@Injectable({ providedIn: 'root' })
export class SavedRecipesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL) + '/saved-recipes';
  save(
    result: SavableRecipeResult,
    title: string,
    checkedProductIds: string[],
    checkedItemIds: string[],
  ) {
    return this.http
      .post<SavedRecipe>(this.base, {
        result,
        title,
        ...(isPantryResult(result) ? { checkedItemIds } : { checkedProductIds }),
      })
      .pipe(timeout(10000));
  }
  list(offset = 0) {
    return this.http
      .get<SavedRecipeList>(this.base, { params: { limit: 20, offset } })
      .pipe(timeout(10000));
  }
  detail(id: string) {
    return this.http.get<SavedRecipe>(`${this.base}/${id}`).pipe(timeout(10000));
  }
  remove(id: string) {
    return this.http.delete<void>(`${this.base}/${id}`).pipe(timeout(10000));
  }
}
