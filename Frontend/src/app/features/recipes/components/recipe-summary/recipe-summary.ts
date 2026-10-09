import { CurrencyPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { RecipeSummary } from '../../recipe-view.models';

@Component({
  selector: 'app-recipe-summary',
  host: { class: 'contents' },
  imports: [TranslatePipe, CurrencyPipe],
  templateUrl: './recipe-summary.html',
  styleUrl: './recipe-summary.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecipeSummaryPanel {
  protected readonly i18n = inject(I18nService);
  readonly summary = input.required<RecipeSummary>();
  readonly marketName = input<string | null>(null);
  readonly busy = input(false);
  readonly startNew = output<void>();
}
