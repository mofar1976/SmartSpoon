import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { SessionStatus } from '../../../../shared/store/auth/auth.state';

@Component({
  selector: 'app-auth-session-notice',
  host: { class: 'block' },
  imports: [TranslatePipe],
  templateUrl: './auth-session-notice.html',
  styleUrl: './auth-session-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthSessionNotice {
  readonly expired = input(false);
  readonly status = input.required<SessionStatus>();
  readonly busy = input(false);
  readonly retry = output<void>();
}
