import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { RecipeForm, RecipeSummary } from '../../recipe-view.models';

@Component({
  selector: 'app-recipe-review-step',
  host: { class: 'block' },
  imports: [TranslatePipe, ReactiveFormsModule, CurrencyPipe],
  templateUrl: './recipe-review-step.html',
  styleUrl: './recipe-review-step.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeReviewStep {
  protected readonly i18n = inject(I18nService);
  readonly form = input.required<RecipeForm>();
  readonly summary = input.required<RecipeSummary>();
  readonly marketName = input<string | null>(null);
  protected readonly counts = [1, 2, 3, 4, 5, 6, 7];
}
