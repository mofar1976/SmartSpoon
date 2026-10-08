import { Injectable, OnDestroy, effect, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { SessionStore } from '../../core/auth/session-store';
import { RecipeApi } from './recipe-api';
import { RecipeRequest, RecipeResult } from './recipe.models';
import { createRecipeForm, euroToCents } from './recipe-validation';
import { recipeErrorMessage } from './recipe-errors';

@Injectable({ providedIn: 'root' })
export class RecipeWorkspace implements OnDestroy {
  private readonly api = inject(RecipeApi);
  private readonly session = inject(SessionStore);
  readonly form = createRecipeForm();
  readonly step = signal(0);
  readonly busy = signal(false);
  readonly result = signal<RecipeResult | null>(null);
  readonly error = signal('');
  private readonly checked = signal<ReadonlySet<string>>(new Set());
  readonly checkedProductIds = this.checked.asReadonly();
  private owner: string | null = null;
  private request?: Subscription;
  private version = 0;
  private pendingToken: string | null = null;

  constructor() {
    effect(() => {
      if (this.busy() && this.session.token() !== this.pendingToken) this.cancel();
      const user = this.session.user();
      if (user && this.session.authenticated()) {
        if (this.owner && this.owner !== user.id) this.reset();
        this.owner = user.id;
      } else if (this.session.status() === 'anonymous') {
        this.cancel();
        this.result.set(null);
        this.checked.set(new Set());
        if (!this.session.expired()) {
          this.reset();
          this.owner = null;
        }
      }
    });
  }

  next(): boolean {
    if (this.busy()) return false;
    const fields =
      this.step() === 0
        ? (['supermarket', 'budgetEuros', 'persons', 'lifeSituation'] as const)
        : (['diet', 'allergies', 'excludedIngredients', 'maxCookingTimeMinutes'] as const);
    fields.forEach((name) => this.form.controls[name].markAsTouched());
    if (fields.some((name) => this.form.controls[name].invalid)) return false;
    this.error.set('');
    this.step.update((step) => Math.min(step + 1, 2));
    return true;
  }
  back(step = this.step() - 1): void {
    if (!this.busy()) {
      this.step.set(Math.max(0, Math.min(step, this.step())));
      this.error.set('');
    }
  }

  generate(): void {
    if (this.busy()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      const c = this.form.controls;
      this.step.set(
        c.supermarket.invalid ||
          c.budgetEuros.invalid ||
          c.persons.invalid ||
          c.lifeSituation.invalid
          ? 0
          : c.recipeCount.invalid
            ? 2
            : 1,
      );
      return;
    }
    if (!this.session.authenticated()) {
      this.error.set('Bitte melde dich erneut an, um Rezepte zu erstellen.');
      return;
    }
    const v = this.form.getRawValue();
    const request: RecipeRequest = {
      supermarket: v.supermarket as RecipeRequest['supermarket'],
      weeklyBudgetCents: euroToCents(v.budgetEuros)!,
      persons: v.persons,
      lifeSituation: v.lifeSituation as RecipeRequest['lifeSituation'],
      diet: v.diet,
      allergies: [...v.allergies],
      excludedIngredients: [...v.excludedIngredients],
      maxCookingTimeMinutes: v.maxCookingTimeMinutes,
      recipeCount: v.recipeCount,
    };
    const token = this.session.token();
    const version = ++this.version;
    this.pendingToken = token;
    this.error.set('');
    this.result.set(null);
    this.checked.set(new Set());
    this.busy.set(true);
    this.form.disable({ emitEvent: false });
    this.request = this.api.generate(request).subscribe({
      next: (result) => {
        if (version !== this.version || token !== this.session.token()) return;
        this.result.set(result);
        this.finish();
      },
      error: (error) => {
        if (version !== this.version || token !== this.session.token()) return;
        this.error.set(recipeErrorMessage(error));
        this.finish();
      },
    });
  }
  setPurchased(productId: string, purchased: boolean): void {
    if (!this.result()?.shoppingList.some((item) => item.product.id === productId)) return;
    const checked = new Set(this.checked());
    if (purchased) checked.add(productId);
    else checked.delete(productId);
    this.checked.set(checked);
  }
  edit(): void {
    if (!this.busy()) {
      this.result.set(null);
      this.checked.set(new Set());
      this.error.set('');
      this.step.set(0);
    }
  }
  reset(): void {
    this.cancel();
    this.form.reset();
    this.step.set(0);
    this.result.set(null);
    this.checked.set(new Set());
    this.error.set('');
  }
  cancel(): void {
    this.version++;
    this.request?.unsubscribe();
    if (this.busy())
      this.error.set('Die Anfrage wurde unterbrochen. Deine Angaben bleiben erhalten.');
    this.finish();
  }
  private finish(): void {
    this.busy.set(false);
    this.form.enable({ emitEvent: false });
  }
  ngOnDestroy(): void {
    this.cancel();
  }
}
