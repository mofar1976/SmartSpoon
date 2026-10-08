import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RecipeSaveState } from '../recipe-save-state';
import { RecipeWorkspace } from '../recipe-workspace';
@Component({
  selector: 'app-save-selection',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './save-selection.html',
  styleUrl: './save-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveSelection {
  protected readonly state = inject(RecipeSaveState);
  protected readonly workspace = inject(RecipeWorkspace);
}
