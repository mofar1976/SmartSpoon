import { RecipeWorkspace } from '../../recipes/recipe-workspace';
import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SessionStore } from '../../../core/auth/session-store';
import { RecipeResults } from '../../recipes/recipe-results/recipe-results';
import { RecipeSaveState } from '../../recipes/recipe-save-state';
import { SavedRecipesStore } from '../saved-recipes-store';
@Component({
  imports: [CurrencyPipe, DatePipe, RouterLink, RecipeResults],
  providers: [SavedRecipesStore],
  templateUrl: './saved-recipes-page.html',
  styleUrl: './saved-recipes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedRecipesPage {
  protected readonly store = inject(SavedRecipesStore);
  private readonly session = inject(SessionStore);
  private readonly workspace = inject(RecipeWorkspace);
  private readonly saveState = inject(RecipeSaveState);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly target = signal<{ id: string; title: string } | null>(null);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
  private offset = 0;
  constructor() {
    effect(() => {
      const id = this.params().get('id'),
        token = this.session.token();
      untracked(() => {
        if (token) {
          this.offset = 0;
          this.store.load(id);
          this.closeDelete();
        } else {
          this.target.set(null);
          this.dialog()?.nativeElement.close();
        }
      });
    });
    effect(() => {
      const deleted = this.store.deletedId();
      if (deleted)
        untracked(() => {
          this.saveState.forget(deleted);
          this.closeDelete();
          if (this.params().get('id')) void this.router.navigateByUrl('/gespeichert');
        });
    });
  }
  protected reload(): void {
    this.store.load(this.params().get('id'), this.store.list()?.offset ?? this.offset);
  }
  protected page(offset: number): void {
    this.offset = offset;
    this.store.load(null, offset);
  }
  protected newRequest(): void {
    this.workspace.reset();
    void this.router.navigateByUrl('/rezepte');
  }
  protected askDelete(id: string, title: string): void {
    this.target.set({ id, title });
    this.store.deleteError.set('');
    this.dialog()?.nativeElement.showModal();
  }
  protected closeDelete(): void {
    if (this.store.deleting()) return;
    this.dialog()?.nativeElement.close();
    this.target.set(null);
  }
  protected cancelDelete(event: Event): void {
    event.preventDefault();
    this.closeDelete();
  }
  protected confirmDelete(): void {
    const target = this.target();
    if (target) this.store.remove(target.id);
  }
}
