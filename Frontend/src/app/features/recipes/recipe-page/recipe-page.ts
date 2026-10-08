import { SaveSelection } from '../save-selection/save-selection';
import { RecipeSaveState } from '../recipe-save-state';
import { MultiSelect } from '../../../shared/ui/multi-select/multi-select';
import { CurrencyPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { RecipeApi } from '../recipe-api';
import { Market } from '../recipe.models';
import {
  ALLERGEN_OPTIONS,
  DIET_OPTIONS,
  INGREDIENT_OPTIONS,
  LIFE_OPTIONS,
} from '../recipe-options';
import { RecipeWorkspace } from '../recipe-workspace';
import { euroToCents, oneOf } from '../recipe-validation';
import { RecipeResults } from '../recipe-results/recipe-results';

@Component({
  imports: [CurrencyPipe, ReactiveFormsModule, RecipeResults, MultiSelect, SaveSelection],
  templateUrl: './recipe-page.html',
  styleUrl: './recipe-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipePage implements OnDestroy {
  protected readonly saveState = inject(RecipeSaveState);
  protected readonly workspace = inject(RecipeWorkspace);
  private readonly api = inject(RecipeApi);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly form = this.workspace.form;
  protected readonly markets = signal<Market[]>([]);
  protected readonly marketsLoading = signal(false);
  protected readonly marketError = signal('');
  protected readonly lifeOptions = LIFE_OPTIONS;
  protected readonly diets = DIET_OPTIONS;
  protected readonly allergens = ALLERGEN_OPTIONS;
  protected readonly ingredients = INGREDIENT_OPTIONS;
  protected readonly counts = [1, 2, 3, 4, 5, 6, 7];
  protected readonly steps = ['Dein Einkauf', 'Dein Essen', 'Deine Auswahl'];
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
      market: this.markets().find((m) => m.id === v.supermarket)?.name ?? 'Noch offen',
      life: LIFE_OPTIONS.find((o) => o.value === v.lifeSituation)?.label ?? 'Noch offen',
      diet: DIET_OPTIONS.find((o) => o.value === v.diet)?.label ?? '',
      allergies:
        ALLERGEN_OPTIONS.filter((o) => v.allergies.includes(o.value))
          .map((o) => o.label)
          .join(', ') || 'Keine angegeben',
      exclusions:
        INGREDIENT_OPTIONS.filter((o) => v.excludedIngredients.includes(o.value))
          .map((o) => o.label)
          .join(', ') || 'Keine',
    };
  });
  private readonly content = viewChild<ElementRef<HTMLElement>>('content');
  private readonly heading = viewChild<ElementRef<HTMLElement>>('stepHeading');

  constructor() {
    this.loadMarkets();
    effect(() => {
      if (this.workspace.result())
        requestAnimationFrame(() =>
          this.content()?.nativeElement.querySelector<HTMLElement>('#result-title')?.focus(),
        );
    });
  }
  protected loadMarkets(): void {
    if (this.marketsLoading()) return;
    this.marketsLoading.set(true);
    this.marketError.set('');
    this.api
      .supermarkets()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (markets) => {
          this.markets.set(markets);
          this.form.controls.supermarket.setValidators([
            Validators.required,
            oneOf(markets.map((m) => m.id)),
          ]);
          this.form.controls.supermarket.updateValueAndValidity();
          this.marketsLoading.set(false);
          if (!markets.length)
            this.marketError.set(
              'Zurzeit sind keine Supermärkte verfügbar. Bitte versuche es später erneut.',
            );
        },
        error: () => {
          this.marketsLoading.set(false);
          this.marketError.set(
            'Die Supermärkte konnten nicht geladen werden. Bitte prüfe die Verbindung und versuche es erneut.',
          );
        },
      });
  }
  protected proceed(): void {
    if (this.workspace.busy() || this.marketError() || this.marketsLoading()) return;
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
    if (this.workspace.busy()) this.workspace.cancel();
  }
}
