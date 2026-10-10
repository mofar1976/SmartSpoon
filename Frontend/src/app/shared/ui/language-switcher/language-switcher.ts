import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../core/i18n/i18n-service';
@Component({
  selector: 'app-language-switcher',
  imports: [TranslatePipe],
  templateUrl: './language-switcher.html',
  styleUrl: './language-switcher.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageSwitcher {
  protected readonly i18n = inject(I18nService);
}
