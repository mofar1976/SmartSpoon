import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { PantryResult } from '../../pantry-recipes.models';
@Component({
  selector: 'app-pantry-results',
  imports: [TranslatePipe],
  templateUrl: './pantry-results.html',
  styleUrl: './pantry-results.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PantryResults {
  readonly result = input.required<PantryResult>();
  readonly checkedItemIds = input<readonly string[]>([]);
  readonly disabled = input(false);
  readonly purchasedChange = output<{ itemId: string; purchased: boolean }>();
}
