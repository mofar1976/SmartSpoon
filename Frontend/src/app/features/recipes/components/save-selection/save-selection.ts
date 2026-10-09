import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { RecipesFacade } from '../../../../shared/store/recipes/recipes.facade';
import { SavedRecipesFacade } from '../../../../shared/store/saved-recipes/saved-recipes.facade';
import { RecipeSaveForm } from '../../recipe-save-form.service';

@Component({
  selector: 'app-save-selection',
  imports: [AsyncPipe, TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './save-selection.html',
  styleUrl: './save-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveSelection {
  protected readonly i18n = inject(I18nService);
  protected readonly form = inject(RecipeSaveForm);
  protected readonly saved = inject(SavedRecipesFacade);
  protected readonly recipes = inject(RecipesFacade);
}
