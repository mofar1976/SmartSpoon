import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { safeReturnUrl } from '../../../shared/guards/auth.guard';
import { authErrorMessage } from '../auth-errors';
import { berlinToday, birthDateValidator, usernameValidator } from '../auth-validation';

@Component({
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthService);
  protected readonly register = this.route.snapshot.data['mode'] === 'register';
  protected readonly maxDate = berlinToday();
  protected readonly busy = signal(false);
  protected readonly showPassword = signal(false);
  protected readonly error = signal('');
  protected readonly reason = this.route.snapshot.queryParamMap.get('reason');
  protected readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  private readonly formElement = viewChild<ElementRef<HTMLFormElement>>('formElement');
  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, usernameValidator]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    birthDate: ['', this.register ? [Validators.required, birthDateValidator] : []],
  });

  async submit(): Promise<void> {
    if (this.busy()) return;
    this.error.set('');
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      requestAnimationFrame(() =>
        this.formElement()?.nativeElement.querySelector<HTMLElement>('input.ng-invalid')?.focus(),
      );
      return;
    }
    this.busy.set(true);
    const value = this.form.getRawValue();
    const credentials = { username: value.username.trim().toLowerCase(), password: value.password };
    try {
      if (this.register) await this.auth.register({ ...credentials, birthDate: value.birthDate });
      else await this.auth.login(credentials);
      this.form.controls.password.reset();
      await this.router.navigateByUrl(this.returnUrl);
    } catch (error) {
      this.error.set(authErrorMessage(error, this.register));
    } finally {
      this.busy.set(false);
    }
  }

  async retrySession(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      if (await this.auth.restore()) await this.router.navigateByUrl(this.returnUrl);
    } finally {
      this.busy.set(false);
    }
  }
}
