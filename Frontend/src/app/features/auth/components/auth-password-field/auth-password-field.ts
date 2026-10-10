import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';

@Component({
  selector: 'app-auth-password-field',
  host: { class: 'block' },
  imports: [TranslatePipe, ReactiveFormsModule],
  templateUrl: './auth-password-field.html',
  styleUrl: './auth-password-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPasswordField {
  protected readonly i18n = inject(I18nService);
  readonly control = input.required<FormControl<string>>();
  readonly busy = input(false);
  readonly register = input(false);
  protected readonly showPassword = signal(false);
}
