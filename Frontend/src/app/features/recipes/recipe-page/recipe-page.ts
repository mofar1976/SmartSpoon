import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, defer, filter, map, startWith } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n-service';
import { RecipesFacade } from '../../../shared/store/recipes/recipes.facade';
import { SavedRecipesFacade } from '../../../shared/store/saved-recipes/saved-recipes.facade';
import { SupermarketsFacade } from '../../../shared/store/supermarkets/supermarkets.facade';
import { RecipeFoodStep } from '../components/recipe-food-step/recipe-food-step';
import { RecipeResults } from '../components/recipe-results/recipe-results';
import { RecipeReviewStep } from '../components/recipe-review-step/recipe-review-step';
import { RecipeShoppingStep } from '../components/recipe-shopping-step/recipe-shopping-step';
import { RecipeSummaryPanel } from '../components/recipe-summary/recipe-summary';
import { SaveSelection } from '../components/save-selection/save-selection';
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  INGREDIENT_OPTIONS,
  LIFE_OPTIONS,
} from '../recipe-options';
import { euroToCents, oneOf } from '../recipe-validation';
import { RecipeWorkspace } from '../recipe-workspace';

@Component({
  host: { class: 'block' },
  imports: [
    AsyncPipe,
    TranslatePipe,
    ReactiveFormsModule,
    RecipeResults,
    RecipeShoppingStep,
    RecipeFoodStep,
    RecipeReviewStep,
    RecipeSummaryPanel,
    SaveSelection,
  ],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePage implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  protected readonly saved = inject(SavedRecipesFacade);
  protected readonly workspace = inject(RecipeWorkspace);
  protected readonly recipes = inject(RecipesFacade);
  protected readonly markets = inject(SupermarketsFacade);
  protected readonly form = this.workspace.form;
  protected readonly marketName$ = combineLatest([
    this.markets.items$,
    defer(() =>
      this.form.controls.supermarket.valueChanges.pipe(
        startWith(this.form.controls.supermarket.value),
      ),
    ),
  ]).pipe(map(([items, id]) => items.find((market) => market.id === id)?.name ?? null));
  protected readonly steps = ['recipes.step1', 'recipes.step2', 'recipes.step3'];
  private readonly changes = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly summary = computed(() => {
    this.changes();
    const v = this.form.getRawValue();
    return {
      budgetCents: euroToCents(v.budgetEuros),
      persons: v.persons,
      minutes: v.maxCookingTimeMinutes,
      life: this.i18n.t(
        LIFE_OPTIONS.find((o) => o.value === v.lifeSituation)?.label ?? 'common.pending',
      ),
      diet: this.i18n.t(DIET_OPTIONS.find((o) => o.value === v.diet)?.label ?? 'common.pending'),
      allergies:
        ALLERGEN_OPTIONS.filter((o) => v.allergies.includes(o.value))
          .map((o) => this.i18n.t(o.label))
          .join(', ') || this.i18n.t('common.noneSpecified'),
      exclusions:
        INGREDIENT_OPTIONS.filter((o) => v.excludedIngredients.includes(o.value))
          .map((o) => this.i18n.t(o.label))
          .join(', ') || this.i18n.t('common.none'),
    };
  });
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  constructor() {
    this.markets.items$.pipe(takeUntilDestroyed()).subscribe((items) => {
      this.form.controls.supermarket.setValidators([
        Validators.required,
        oneOf(items.map((market) => market.id)),
      ]);
      this.form.controls.supermarket.updateValueAndValidity({ emitEvent: false });
    });
    this.markets.load();
    this.recipes.result$
      .pipe(
        filter((result) => result !== null),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        requestAnimationFrame(() =>
          this.content()?.nativeElement.querySelector<HTMLElement>('#result-title')?.focus(),
        );
      });
  }
  protected proceed(marketsUnavailable: boolean): void {
    if (this.recipes.snapshot().requestId !== null || marketsUnavailable) return;
    if (this.workspace.step() < 2) {
      if (this.workspace.next()) this.focusHeading();
      else this.focusInvalid();
    } else {
      this.workspace.generate();
      if (this.form.invalid) this.focusInvalid();
    }
  }
  protected back(step?: number): void {
    this.workspace.back(step);
    this.focusHeading();
  }
  protected startNew(): void {
    this.workspace.reset();
    this.focusHeading();
  }
  protected edit(): void {
    this.workspace.edit();
    this.focusHeading();
  }
  private focusHeading(): void {
    requestAnimationFrame(() => this.heading()?.nativeElement.focus());
  }
  private focusInvalid(): void {
    requestAnimationFrame(() =>
      this.content()
        ?.nativeElement.querySelector<HTMLElement>(
          'input.ng-invalid, select.ng-invalid, app-multi-select.ng-invalid button',
        )
        ?.focus(),
    );
  }
  ngOnDestroy(): void {
    if (this.recipes.snapshot().requestId !== null) this.recipes.cancel();
  }
}
