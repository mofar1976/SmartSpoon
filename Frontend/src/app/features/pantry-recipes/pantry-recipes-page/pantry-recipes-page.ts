import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { combineLatest, distinctUntilChanged, map } from 'rxjs';
import { SavedRecipesFacade } from '../../../shared/store/saved-recipes/saved-recipes.facade';
import { SaveSelectionForm } from '../../../shared/ui/save-selection/save-selection';
import { AuthFacade } from '../../../shared/store/auth/auth.facade';
import { PantryRecipesFacade } from '../../../shared/store/pantry-recipes/pantry-recipes.facade';
import { TranslationKey } from '../../../core/i18n/translation-key';
import { exclusions, ingredientRow, pantryForm } from '../pantry-form';
import { PhotoUpload } from '../components/photo-upload/photo-upload';
import { IngredientEditor } from '../components/ingredient-editor/ingredient-editor';
import { PantryPreferences } from '../components/pantry-preferences/pantry-preferences';
import { PantryResults } from '../components/pantry-results/pantry-results';
@Component({
  selector: 'app-pantry-recipes-page',
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TranslatePipe,
    PhotoUpload,
    IngredientEditor,
    PantryPreferences,
    PantryResults,
    SaveSelectionForm,
  ],
  templateUrl: './pantry-recipes-page.html',
  styleUrl: './pantry-recipes-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantryRecipesPage {
  readonly saved = inject(SavedRecipesFacade);
  readonly pantry = inject(PantryRecipesFacade);
  private readonly auth = inject(AuthFacade);
  private readonly destroyRef = inject(DestroyRef);
  readonly form = pantryForm();
  readonly preview = signal<string | null>(null);
  readonly filename = signal('');
  readonly photoError = signal<TranslationKey | null>(null);
  readonly submitted = signal(false);
  private photo: File | null = null;
  constructor() {
    this.pantry.reset();
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.pantry.draftChanged());
    this.form.controls.ingredients.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.form.controls.confirmed.setValue(false, { emitEvent: false }));
    this.pantry.state$
      .pipe(
        map((s) => s.recognition),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((recognition) => {
        if (!recognition) return;
        const rows = this.form.controls.ingredients;
        rows.clear({ emitEvent: false });
        for (const ingredient of recognition.ingredients)
          rows.push(ingredientRow(ingredient.name), { emitEvent: false });
        rows.updateValueAndValidity();
        this.form.controls.confirmed.setValue(false);
        this.submitted.set(false);
      });
    combineLatest([this.pantry.vm$, this.saved.pantrySaveVm$])
      .pipe(
        map(([s, save]) => s.busy || save.busy),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe((busy) =>
        busy ? this.form.disable({ emitEvent: false }) : this.form.enable({ emitEvent: false }),
      );
    this.auth.state$
      .pipe(
        map((s) => s.token),
        distinctUntilChanged(),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.clearLocal());
    this.destroyRef.onDestroy(() => {
      this.releasePhoto();
      this.pantry.reset();
    });
  }
  private releasePhoto() {
    const url = this.preview();
    if (url) URL.revokeObjectURL(url);
    this.preview.set(null);
    this.filename.set('');
    this.photo = null;
  }
  private clearLocal() {
    this.releasePhoto();
    this.photoError.set(null);
    this.form.controls.ingredients.clear({ emitEvent: false });
    this.form.reset(undefined, { emitEvent: false });
    this.submitted.set(false);
  }
  selectPhoto(file: File) {
    if (this.pantry.snapshot().operation) return;
    if (file.size > 10 * 1024 * 1024) {
      this.photoError.set('pantry.errorSize');
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError.set('pantry.errorFormat');
      return;
    }
    this.pantry.reset();
    this.releasePhoto();
    this.photo = file;
    this.preview.set(URL.createObjectURL(file));
    this.filename.set(file.name);
    this.photoError.set(null);
    this.form.controls.confirmed.setValue(false);
    this.submitted.set(false);
  }
  analyze() {
    if (this.photo) this.pantry.analyze(this.photo);
  }
  addIngredient() {
    if (!this.pantry.snapshot().operation && this.form.controls.ingredients.length < 40)
      this.form.controls.ingredients.push(ingredientRow());
  }
  removeIngredient(index: number) {
    if (!this.pantry.snapshot().operation) this.form.controls.ingredients.removeAt(index);
  }
  generate() {
    if (this.pantry.snapshot().operation) return;
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.pantry.generate({
      ingredientsConfirmed: true,
      ingredients: v.ingredients.map((i) => ({
        name: i.name.trim(),
        ...(i.quantity !== null && i.unit ? { quantity: i.quantity, unit: i.unit } : {}),
      })),
      persons: v.persons,
      maxCookingTimeMinutes: v.maxCookingTimeMinutes,
      recipeCount: v.recipeCount,
      diet: v.diet,
      allergies: [...v.allergies],
      excludedIngredients: exclusions(v.excludedIngredients),
      allowAdditionalIngredients: v.allowAdditionalIngredients,
    });
  }
}
