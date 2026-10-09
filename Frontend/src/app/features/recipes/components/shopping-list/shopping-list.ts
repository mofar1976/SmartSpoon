import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { RecipeResult } from '../../recipe.models';

@Component({
  selector: 'app-shopping-list',
  imports: [TranslatePipe, CurrencyPipe, DecimalPipe],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingList {
  protected readonly i18n = inject(I18nService);
  readonly stored = input(false);
  readonly result = input.required<RecipeResult>();
  readonly checkedProductIds = input.required<readonly string[]>();
  readonly purchasedChange = output<{ productId: string; purchased: boolean }>();
  readonly purchasedCount = computed(
    () =>
      this.result().shoppingList.filter((item) =>
        this.checkedProductIds().includes(item.product.id),
      ).length,
  );
}
