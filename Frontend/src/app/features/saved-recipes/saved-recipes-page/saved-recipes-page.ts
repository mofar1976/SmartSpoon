import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n-service';
import { RecipeWorkspace } from '../../recipes/recipe-workspace';
import { AsyncPipe, CurrencyPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthFacade } from '../../../shared/store/auth/auth.facade';
import { RecipeResults } from '../../recipes/recipe-results/recipe-results';
import { SavedRecipesFacade } from '../../../shared/store/saved-recipes/saved-recipes.facade';
@Component({
  imports: [AsyncPipe, TranslatePipe, CurrencyPipe, DatePipe, RouterLink, RecipeResults],
  templateUrl: './saved-recipes-page.html',
  styleUrl: './saved-recipes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedRecipesPage implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly store = inject(SavedRecipesFacade);
  private readonly session = inject(AuthFacade);
  private readonly workspace = inject(RecipeWorkspace);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected readonly target = signal<{ id: string; title: string } | null>(null);
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
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
          this.dialog()?.nativeElement.close();
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
    this.workspace.reset();
    void this.router.navigateByUrl('/rezepte');
  }
  protected askDelete(id: string, title: string): void {
    this.target.set({ id, title });
    this.store.clearDeleteError();
    this.dialog()?.nativeElement.showModal();
  }
  protected closeDelete(): void {
    if (this.store.snapshot().deleteRequestId !== null) return;
    this.dialog()?.nativeElement.close();
    this.target.set(null);
  }
  protected cancelDelete(event: Event): void {
    event.preventDefault();
    this.closeDelete();
  }
  ngOnDestroy(): void {
    this.store.clearView();
  }
  protected confirmDelete(): void {
    const target = this.target();
    if (target) this.store.remove(target.id);
  }
}
