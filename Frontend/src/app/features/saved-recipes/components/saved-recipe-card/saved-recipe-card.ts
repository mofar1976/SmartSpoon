import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { SavedRecipeSummary } from '../../saved-recipes.models';

@Component({
  selector: 'app-saved-recipe-card',
  host: { class: 'contents' },
  imports: [TranslatePipe, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './saved-recipe-card.html',
  styleUrl: './saved-recipe-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SavedRecipeCard {
  protected readonly i18n = inject(I18nService);
  readonly item = input.required<SavedRecipeSummary>();
  readonly deleting = input(false);
  readonly deleteRequested = output<{ id: string; title: string }>();
}
