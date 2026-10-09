import { Button } from '../../../../shared/ui/button/button';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { TranslationKey } from '../../../../core/i18n/translation-key';
import { AuthForm } from '../../auth-form.model';
import { AuthBirthDateField } from '../auth-birth-date-field/auth-birth-date-field';
import { AuthPasswordField } from '../auth-password-field/auth-password-field';
import { AuthUsernameField } from '../auth-username-field/auth-username-field';

@Component({
  selector: 'app-auth-form',
  host: { class: 'block' },
  imports: [
    Button,
    TranslatePipe,
    ReactiveFormsModule,
    AuthUsernameField,
    AuthPasswordField,
    AuthBirthDateField,
  ],
  templateUrl: './auth-form.html',
  styleUrl: './auth-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthFormComponent {
  protected readonly i18n = inject(I18nService);
  readonly form = input.required<AuthForm>();
  readonly register = input(false);
  readonly busy = input(false);
  readonly errorKey = input<TranslationKey | null>(null);
  readonly maxDate = input.required<string>();
  readonly submitted = output<void>();
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  focusInvalid(): void {
    requestAnimationFrame(() =>
      this.element.nativeElement.querySelector<HTMLElement>('input.ng-invalid')?.focus(),
    );
  }
}
