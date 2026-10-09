import { Button } from '../../../../shared/ui/button/button';
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { RecipeResults } from '../../../recipes/components/recipe-results/recipe-results';
import { SavedRecipe } from '../../saved-recipes.models';

@Component({
  selector: 'app-saved-recipe-detail',
  host: { class: 'block' },
  imports: [Button, TranslatePipe, DatePipe, RouterLink, RecipeResults],
  templateUrl: './saved-recipe-detail.html',
  styleUrl: './saved-recipe-detail.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedRecipeDetail {
  protected readonly i18n = inject(I18nService);
  readonly savedSelection = input.required<SavedRecipe>();
  readonly checkedProductIds = input.required<readonly string[]>();
  readonly deleting = input(false);
  readonly deleteRequested = output<{ id: string; title: string }>();
  readonly purchasedChanged = output<{ productId: string; purchased: boolean }>();
  readonly startNew = output<void>();
}
