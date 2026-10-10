import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-intro',
  host: { class: 'contents' },
  imports: [TranslatePipe],
  templateUrl: './auth-intro.html',
  styleUrl: './auth-intro.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthIntro {}
