import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppShell {
  protected readonly auth = inject(AuthService);
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
