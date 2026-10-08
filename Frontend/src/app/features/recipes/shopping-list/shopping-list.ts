import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RecipeResult } from '../recipe.models';

@Component({
  selector: 'app-shopping-list',
  imports: [CurrencyPipe, DecimalPipe],
  templateUrl: './shopping-list.html',
  styleUrl: './shopping-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShoppingList {
  readonly stored = input(false);
  readonly result = input.required<RecipeResult>();
  readonly checkedProductIds = input.required<ReadonlySet<string>>();
  readonly purchasedChange = output<{ productId: string; purchased: boolean }>();
  readonly purchasedCount = computed(
    () =>
      this.result().shoppingList.filter((item) => this.checkedProductIds().has(item.product.id))
        .length,
  );
}
