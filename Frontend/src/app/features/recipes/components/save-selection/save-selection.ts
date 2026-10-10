import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RecipesFacade } from '../../../../shared/store/recipes/recipes.facade';
import { SavedRecipesFacade } from '../../../../shared/store/saved-recipes/saved-recipes.facade';
import { SaveSelectionForm } from '../../../../shared/ui/save-selection/save-selection';
@Component({
  selector: 'app-save-selection',
  imports: [AsyncPipe, SaveSelectionForm],
  templateUrl: './save-selection.html',
  styleUrl: './save-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveSelection {
  readonly recipes = inject(RecipesFacade);
  readonly saved = inject(SavedRecipesFacade);
}
