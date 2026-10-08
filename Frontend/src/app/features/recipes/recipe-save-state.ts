import { Injectable, OnDestroy, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SessionStore } from '../../core/auth/session-store';
import { RecipeWorkspace } from './recipe-workspace';
import { RecipeResult } from './recipe.models';
import { SavedRecipesApi } from '../saved-recipes/saved-recipes-api';
import { savedRecipesError } from '../saved-recipes/saved-recipes-errors';
@Injectable({ providedIn: 'root' })
export class RecipeSaveState implements OnDestroy {
  private readonly workspace = inject(RecipeWorkspace);
  private readonly session = inject(SessionStore);
  private readonly api = inject(SavedRecipesApi);
  readonly title = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.maxLength(120),
      (control) =>
        typeof control.value === 'string' && control.value.trim() ? null : { blank: true },
    ],
  });
  readonly busy = signal(false);
  readonly savedId = signal<string | null>(null);
  readonly error = signal('');
  private source: RecipeResult | null = null;
  private token: string | null = null;
  private request?: Subscription;
  private version = 0;
  constructor() {
    effect(() => {
      const source = this.workspace.result(),
        token = this.session.token();
      untracked(() => {
        if (source !== this.source || token !== this.token) {
          this.cancel();
          this.source = source;
          this.token = token;
          this.savedId.set(null);
          this.error.set('');
          this.title.reset(source?.recipes[0]?.title ?? '');
        }
      });
    });
  }
  save(): void {
    if (this.busy() || this.savedId()) return;
    this.title.markAsTouched();
    if (this.title.invalid) return;
    const source = this.workspace.result(),
      token = this.session.token();
    if (!source?.saveProof || !this.session.authenticated()) {
      this.error.set('Bitte erstelle eine neue Auswahl und melde dich bei Bedarf erneut an.');
      return;
    }
    const version = ++this.version;
    this.busy.set(true);
    this.error.set('');
    this.request = this.api
      .save(source, this.title.value.trim(), [...this.workspace.checkedProductIds()])
      .subscribe({
        next: (saved) => {
          if (this.current(version, source, token)) {
            this.savedId.set(saved.id);
            this.title.setValue(saved.title);
            this.busy.set(false);
          }
        },
        error: (error) => {
          if (this.current(version, source, token)) {
            this.error.set(savedRecipesError(error, 'save'));
            this.busy.set(false);
          }
        },
      });
  }
  forget(id: string): void {
    if (this.savedId() === id) {
      this.savedId.set(null);
      this.error.set('');
    }
  }
  private current(version: number, source: RecipeResult, token: string | null) {
    return (
      version === this.version &&
      source === this.workspace.result() &&
      token === this.session.token()
    );
  }
  private cancel(): void {
    this.version++;
    this.request?.unsubscribe();
    this.busy.set(false);
  }
  ngOnDestroy(): void {
    this.cancel();
  }
}
