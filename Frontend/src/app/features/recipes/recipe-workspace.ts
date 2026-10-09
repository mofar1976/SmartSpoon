import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Injectable, inject, signal } from '@angular/core';
import { RecipesFacade } from '../../shared/store/recipes/recipes.facade';
import { AuthFacade } from '../../shared/store/auth/auth.facade';
import { RecipeRequest } from './recipe.models';
import { createRecipeForm, euroToCents } from './recipe-validation';

@Injectable({ providedIn: 'root' })
export class RecipeWorkspace {
  private readonly recipes = inject(RecipesFacade);
  private readonly session = inject(AuthFacade);
  readonly form = createRecipeForm();
  readonly step = signal(0);
  private owner: string | null = null;
  constructor() {
    this.recipes.busy$.pipe(takeUntilDestroyed()).subscribe((busy) => {
      if (busy) this.form.disable({ emitEvent: false });
      else this.form.enable({ emitEvent: false });
    });
    this.session.state$.pipe(takeUntilDestroyed()).subscribe(() => {
      const user = this.session.snapshot().user;
      if (user && this.session.snapshot().status === 'authenticated') {
        if (this.owner && this.owner !== user.id) this.reset();
        this.owner = user.id;
      } else if (this.session.snapshot().status === 'anonymous') {
        if (!this.session.snapshot().expired) {
          this.reset();
          this.owner = null;
        }
      }
    });
  }

  next(): boolean {
    if (this.recipes.snapshot().requestId !== null) return false;
    const fields =
      this.step() === 0
        ? (['supermarket', 'budgetEuros', 'persons', 'lifeSituation'] as const)
        : (['diet', 'allergies', 'excludedIngredients', 'maxCookingTimeMinutes'] as const);
    fields.forEach((name) => this.form.controls[name].markAsTouched());
    if (fields.some((name) => this.form.controls[name].invalid)) return false;
    this.recipes.setError(null);
    this.step.update((step) => Math.min(step + 1, 2));
    return true;
  }
  back(step = this.step() - 1): void {
    if (this.recipes.snapshot().requestId === null) {
      this.step.set(Math.max(0, Math.min(step, this.step())));
      this.recipes.setError(null);
    }
  }

  generate(): void {
    if (this.recipes.snapshot().requestId !== null) return;
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
    if (this.session.snapshot().status !== 'authenticated') {
      this.recipes.setError('errors.sessionExpired');
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
    this.recipes.generate(request);
  }
  edit(): void {
    if (this.recipes.snapshot().requestId !== null) return;
    this.recipes.reset();
    this.step.set(0);
  }
  reset(): void {
    this.recipes.reset();
    this.form.reset();
    this.step.set(0);
  }
}
