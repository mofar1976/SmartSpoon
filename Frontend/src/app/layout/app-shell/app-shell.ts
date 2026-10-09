import { AsyncPipe } from '@angular/common';
import { LanguageSwitcher } from '../../shared/ui/language-switcher/language-switcher';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../core/i18n/i18n-service';
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../../shared/store/auth/auth.facade';

@Component({
  selector: 'app-shell',
  host: { class: 'flex flex-col min-h-dvh' },
  imports: [AsyncPipe, LanguageSwitcher, TranslatePipe, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly i18n = inject(I18nService);
  protected readonly auth = inject(AuthFacade);
  private readonly main = viewChild<ElementRef<HTMLElement>>('main');
  private hasActivated = false;
  protected focusContent(): void {
    // Preserve the normal tab order on first load; focus content on SPA navigation.
    if (!this.hasActivated) {
      this.hasActivated = true;
      return;
    }
    this.main()?.nativeElement.focus({ preventScroll: true });
  }
}
