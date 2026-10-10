import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { AuthFacade } from '../../../shared/store/auth/auth.facade';
import { SavedRecipesFacade } from '../../../shared/store/saved-recipes/saved-recipes.facade';
import { RecipeWorkspace } from '../../recipes/recipe-workspace';
import { DeleteSelectionDialog } from '../components/delete-selection-dialog/delete-selection-dialog';
import { SavedRecipeDetail } from '../components/saved-recipe-detail/saved-recipe-detail';
import { SavedRecipesList } from '../components/saved-recipes-list/saved-recipes-list';

@Component({
  imports: [
    AsyncPipe,
    TranslatePipe,
    RouterLink,
    SavedRecipesList,
    SavedRecipeDetail,
    DeleteSelectionDialog,
  ],
  templateUrl: './saved-recipes-page.html',
  styleUrl: './saved-recipes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedRecipesPage implements OnDestroy {
  protected readonly store = inject(SavedRecipesFacade);
  private readonly session = inject(AuthFacade);
  private readonly workspace = inject(RecipeWorkspace);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly target = signal<{ id: string; title: string } | null>(null);
  private offset = 0;
  constructor() {
    combineLatest([
      this.route.paramMap,
      this.session.state$.pipe(
        map((state) => state.token),
        distinctUntilChanged(),
      ),
    ])
      .pipe(takeUntilDestroyed())
      .subscribe(([params, token]) => {
        if (token) {
          this.offset = 0;
          this.store.load(params.get('id'));
          this.closeDelete();
        } else {
          this.target.set(null);
        }
      });
    this.store.deletedId$.pipe(takeUntilDestroyed()).subscribe((deleted) => {
      if (!deleted) return;
      this.closeDelete();
      if (this.route.snapshot.paramMap.get('id')) void this.router.navigateByUrl('/gespeichert');
    });
  }
  protected reload(): void {
    this.store.load(
      this.route.snapshot.paramMap.get('id'),
      this.store.snapshot().list?.offset ?? this.offset,
    );
  }
  protected page(offset: number): void {
    this.offset = offset;
    this.store.load(null, offset);
  }
  protected newRequest(): void {
    const pantry = this.store.snapshot().detail?.mode === 'pantry';
    if (!pantry) this.workspace.reset();
    void this.router.navigateByUrl(pantry ? '/vorrat' : '/rezepte');
  }
  protected askDelete(id: string, title: string): void {
    this.target.set({ id, title });
    this.store.clearDeleteError();
  }
  protected closeDelete(): void {
    if (this.store.snapshot().deleteRequestId !== null) return;
    this.target.set(null);
  }
  ngOnDestroy(): void {
    this.store.clearView();
  }
  protected confirmDelete(): void {
    const target = this.target();
    if (target) this.store.remove(target.id);
  }
}
