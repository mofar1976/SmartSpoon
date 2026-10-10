import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { timeout } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api.config';
import {
  PantryRequest,
  PantryResult,
  RecognitionResult,
} from '../../../features/pantry-recipes/pantry-recipes.models';
@Injectable({ providedIn: 'root' })
export class PantryRecipesService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);
  // Files are transient upload data, never serializable Store state or actions.
  private readonly photos = new Map<number, File>();
  stagePhoto(id: number, photo: File) {
    this.photos.set(id, photo);
  }
  clearPhotos() {
    this.photos.clear();
  }
  analyze(id: number) {
    const photo = this.photos.get(id);
    this.photos.delete(id);
    if (!photo) throw new Error('Missing upload');
    const body = new FormData();
    body.append('image', photo);
    return this.http
      .post<RecognitionResult>(this.base + '/ingredient-recognition', body)
      .pipe(timeout(200000));
  }
  generate(request: PantryRequest) {
    return this.http
      .post<PantryResult>(this.base + '/pantry-recipes/generate', request)
      .pipe(timeout(70000));
  }
}
