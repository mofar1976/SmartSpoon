import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { PantryForm } from '../../pantry-form';
import { DIET_OPTIONS, ALLERGEN_OPTIONS } from '../../../recipes/recipe-options';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { MultiSelect } from '../../../../shared/ui/multi-select/multi-select';
@Component({
  selector: 'app-pantry-preferences',
  imports: [ReactiveFormsModule, TranslatePipe, MultiSelect],
  templateUrl: './pantry-preferences.html',
  styleUrl: './pantry-preferences.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantryPreferences {
  readonly form = input.required<PantryForm>();
  readonly diets = DIET_OPTIONS;
  private readonly i18n = inject(I18nService);
  readonly allergens = computed(() =>
    ALLERGEN_OPTIONS.map((o) => ({ value: o.value, label: this.i18n.t(o.label) })),
  );
}
