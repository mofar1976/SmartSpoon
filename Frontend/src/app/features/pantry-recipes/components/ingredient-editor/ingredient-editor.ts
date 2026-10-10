import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormArray, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { IngredientRow } from '../../pantry-form';
@Component({
  selector: 'app-pantry-ingredient-editor',
  imports: [ReactiveFormsModule, TranslatePipe],
  templateUrl: './ingredient-editor.html',
  styleUrl: './ingredient-editor.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IngredientEditor {
  readonly ingredients = input.required<FormArray<IngredientRow>>();
  readonly uncertain = input<readonly string[]>([]);
  readonly add = output<void>();
  readonly remove = output<number>();
}
