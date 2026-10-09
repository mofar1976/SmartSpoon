import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n-service';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { inject, ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ShoppingList } from '../shopping-list/shopping-list';
import { RecipeResult } from '../recipe.models';
@Component({
  selector: 'app-recipe-results',
  host: { class: 'block' },
  imports: [TranslatePipe, CurrencyPipe, DecimalPipe, ShoppingList],
  templateUrl: './recipe-results.html',
  styleUrl: './recipe-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeResults {
  protected readonly i18n = inject(I18nService);
  readonly stored = input(false);
  readonly actionsDisabled = input(false);
  readonly result = input.required<RecipeResult>();
  readonly checkedProductIds = input.required<readonly string[]>();
  readonly purchasedChange = output<{ productId: string; purchased: boolean }>();
  readonly edit = output<void>();
  readonly startNew = output<void>();
}
