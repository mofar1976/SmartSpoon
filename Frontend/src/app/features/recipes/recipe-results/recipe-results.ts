import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ShoppingList } from '../shopping-list/shopping-list';
import { RecipeResult } from '../recipe.models';
@Component({
  selector: 'app-recipe-results',
  imports: [CurrencyPipe, ShoppingList],
  templateUrl: './recipe-results.html',
  styleUrl: './recipe-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeResults {
  readonly stored = input(false);
  readonly actionsDisabled = input(false);
  readonly result = input.required<RecipeResult>();
  readonly checkedProductIds = input.required<ReadonlySet<string>>();
  readonly purchasedChange = output<{ productId: string; purchased: boolean }>();
  readonly edit = output<void>();
  readonly startNew = output<void>();
}
