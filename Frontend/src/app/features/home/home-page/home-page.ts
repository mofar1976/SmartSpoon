import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n-service';
import { inject, ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [TranslatePipe, RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly i18n = inject(I18nService);
}
