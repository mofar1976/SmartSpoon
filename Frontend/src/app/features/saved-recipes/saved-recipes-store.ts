import { Injectable, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { SessionStore } from '../../core/auth/session-store';
import { SavedRecipesApi } from './saved-recipes-api';
import { SavedRecipe, SavedRecipeList } from './saved-recipes.models';
import { savedRecipesError } from './saved-recipes-errors';
@Injectable()
export class SavedRecipesStore implements OnDestroy {
  private readonly api = inject(SavedRecipesApi);
  private readonly session = inject(SessionStore);
  readonly list = signal<SavedRecipeList | null>(null);
  readonly detail = signal<SavedRecipe | null>(null);
  readonly checked = signal<ReadonlySet<string>>(new Set());
  readonly loading = signal(false);
  readonly deleting = signal(false);
  readonly error = signal('');
  readonly deleteError = signal('');
  readonly deletedId = signal<string | null>(null);
  private request?: Subscription;
  private mutation?: Subscription;
  private version = 0;
  private ownerToken: string | null = null;
  constructor() {
    effect(() => {
      const token = this.session.token();
      untracked(() => {
        if (this.ownerToken !== token) {
          this.clear();
          this.ownerToken = token;
        }
      });
    });
  }
  load(id: string | null, offset = 0): void {
    if (!this.session.authenticated()) return;
    this.mutation?.unsubscribe();
    this.deleting.set(false);
    this.request?.unsubscribe();
    const version = ++this.version,
      token = this.session.token();
    this.ownerToken = token;
    this.list.set(null);
    this.detail.set(null);
    this.checked.set(new Set());
    this.error.set('');
    if (id && !/^[a-f\d]{24}$/i.test(id)) {
      this.error.set('Diese gespeicherte Auswahl ist nicht verfügbar.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    const operation: Observable<SavedRecipe | SavedRecipeList> = id
      ? this.api.detail(id)
      : this.api.list(offset);
    this.request = operation.subscribe({
      next: (value) => {
        if (!this.current(version, token)) return;
        if ('result' in value) {
          this.detail.set(value);
          this.checked.set(new Set(value.checkedProductIds));
        } else {
          if (!value.items.length && value.total > 0 && value.offset >= value.total) {
            this.load(null, Math.floor((value.total - 1) / value.limit) * value.limit);
            return;
          }
          this.list.set(value);
        }
        this.loading.set(false);
      },
      error: (error) => {
        if (this.current(version, token)) {
          this.error.set(savedRecipesError(error, 'load'));
          this.loading.set(false);
        }
      },
    });
  }
  setPurchased(productId: string, purchased: boolean): void {
    if (!this.detail()?.result.shoppingList.some((item) => item.product.id === productId)) return;
    const checked = new Set(this.checked());
    if (purchased) checked.add(productId);
    else checked.delete(productId);
    this.checked.set(checked);
  }
  remove(id: string): void {
    if (this.deleting() || !this.session.authenticated()) return;
    const version = this.version,
      token = this.session.token(),
      list = this.list();
    this.deleting.set(true);
    this.deleteError.set('');
    const success = () => {
      if (!this.current(version, token)) return;
      this.deleting.set(false);
      this.deletedId.set(id);
      if (list)
        this.load(
          null,
          list.items.length === 1 && list.offset > 0
            ? Math.max(0, list.offset - list.limit)
            : list.offset,
        );
      else {
        this.detail.set(null);
        this.checked.set(new Set());
      }
    };
    this.mutation = this.api.remove(id).subscribe({
      next: success,
      error: (error) => {
        if (!this.current(version, token)) return;
        if (error instanceof HttpErrorResponse && error.status === 404) success();
        else {
          this.deleting.set(false);
          this.deleteError.set(savedRecipesError(error, 'delete'));
        }
      },
    });
  }
  private current(version: number, token: string | null) {
    return this.version === version && this.session.token() === token;
  }
  private clear(): void {
    this.version++;
    this.request?.unsubscribe();
    this.mutation?.unsubscribe();
    this.list.set(null);
    this.detail.set(null);
    this.checked.set(new Set());
    this.loading.set(false);
    this.deleting.set(false);
    this.error.set('');
    this.deleteError.set('');
    this.deletedId.set(null);
  }
  ngOnDestroy(): void {
    this.clear();
  }
}
