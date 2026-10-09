import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Injectable, inject } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { RecipesFacade } from '../../shared/store/recipes/recipes.facade';
import { SavedRecipesFacade } from '../../shared/store/saved-recipes/saved-recipes.facade';
@Injectable({ providedIn: 'root' })
export class RecipeSaveForm {
  private readonly recipes = inject(RecipesFacade);
  private readonly saved = inject(SavedRecipesFacade);
  readonly title = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.maxLength(120),
      (control) =>
        typeof control.value === 'string' && control.value.trim() ? null : { blank: true },
    ],
  });
  constructor() {
    this.recipes.result$
      .pipe(takeUntilDestroyed())
      .subscribe((result) => this.title.reset(result?.recipes[0]?.title ?? ''));
    this.saved.saveVm$.pipe(takeUntilDestroyed()).subscribe((vm) => {
      if (vm.savedId && vm.savedTitle) this.title.setValue(vm.savedTitle);
    });
  }
  save(): void {
    this.title.markAsTouched();
    if (this.title.valid) this.saved.save(this.title.value);
  }
}
