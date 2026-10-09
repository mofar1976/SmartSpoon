import { Button } from '../button/button';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n-service';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type PageKind = 'recipes' | 'not-found';
const pages = {
  recipes: {
    eyebrow: 'upcoming.recipesEyebrow',
    title: 'upcoming.recipesTitle',
    text: 'upcoming.recipesText',
  },
  'not-found': {
    eyebrow: 'upcoming.notFoundEyebrow',
    title: 'upcoming.notFoundTitle',
    text: 'upcoming.notFoundText',
  },
};

@Component({
  imports: [Button, TranslatePipe, RouterLink],
  templateUrl: './upcoming-page.html',
  styleUrl: './upcoming-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpcomingPage {
  protected readonly i18n = inject(I18nService);
  protected readonly kind = inject(ActivatedRoute).snapshot.data['kind'] as PageKind;
  protected readonly page = pages[this.kind];
}
