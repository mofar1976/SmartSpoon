import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { TranslationKey } from '../../../../core/i18n/translation-key';
import { LIFE_OPTIONS } from '../../recipe-options';
import { RecipeForm } from '../../recipe-view.models';
import { Market } from '../../recipe.models';

@Component({
  selector: 'app-recipe-shopping-step',
  host: { class: 'block' },
  imports: [TranslatePipe, ReactiveFormsModule],
  templateUrl: './recipe-shopping-step.html',
  styleUrl: './recipe-shopping-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeShoppingStep {
  readonly form = input.required<RecipeForm>();
  readonly markets = input.required<{
    items: Market[];
    loading: boolean;
    errorKey: TranslationKey | null;
  }>();
  readonly reload = output<void>();
  protected readonly lifeOptions = LIFE_OPTIONS;
}
