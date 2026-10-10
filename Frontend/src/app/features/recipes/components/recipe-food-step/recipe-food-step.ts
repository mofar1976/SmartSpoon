import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { MultiSelect } from '../../../../shared/ui/multi-select/multi-select';
import { ALLERGEN_OPTIONS, DIET_OPTIONS, INGREDIENT_OPTIONS } from '../../recipe-options';
import { RecipeForm } from '../../recipe-view.models';

@Component({
  selector: 'app-recipe-food-step',
  host: { class: 'block' },
  imports: [TranslatePipe, ReactiveFormsModule, MultiSelect],
  templateUrl: './recipe-food-step.html',
  styleUrl: './recipe-food-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeFoodStep {
  protected readonly i18n = inject(I18nService);
  readonly form = input.required<RecipeForm>();
  protected readonly diets = DIET_OPTIONS;
  protected readonly allergens = computed(() =>
    ALLERGEN_OPTIONS.map((o) => ({ ...o, label: this.i18n.t(o.label) })),
  );
  protected readonly ingredients = computed(() =>
    INGREDIENT_OPTIONS.map((o) => ({ ...o, label: this.i18n.t(o.label) })),
  );
}
