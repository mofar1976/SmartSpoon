import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnDestroy, viewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { I18nService } from '../../../core/i18n/i18n-service';
import { safeReturnUrl } from '../../../shared/guards/auth.guard';
import { AuthFacade } from '../../../shared/store/auth/auth.facade';
import { berlinToday, birthDateValidator, usernameValidator } from '../auth-validation';
import { AuthFormComponent } from '../components/auth-form/auth-form';
import { AuthIntro } from '../components/auth-intro/auth-intro';
import { AuthSessionNotice } from '../components/auth-session-notice/auth-session-notice';

@Component({
  host: { class: 'block' },
  imports: [AsyncPipe, TranslatePipe, RouterLink, AuthIntro, AuthSessionNotice, AuthFormComponent],
  templateUrl: './auth-page.html',
  styleUrl: './auth-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthPage implements OnDestroy {
  protected readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly auth = inject(AuthFacade);
  protected readonly register = this.route.snapshot.data['mode'] === 'register';
  protected readonly maxDate = berlinToday();
  protected readonly reason = this.route.snapshot.queryParamMap.get('reason');
  protected readonly returnUrl = safeReturnUrl(this.route.snapshot.queryParamMap.get('returnUrl'));
  private readonly formComponent = viewChild(AuthFormComponent);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    username: ['', [Validators.required, usernameValidator]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    birthDate: ['', this.register ? [Validators.required, birthDateValidator] : []],
  });

  constructor() {
    this.auth.clearForm();
  }
  submit(): void {
    if (
      this.auth.snapshot().authenticationRequestId !== null ||
      this.auth.snapshot().restoreRequestId !== null
    )
      return;
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formComponent()?.focusInvalid();
      return;
    }
    const value = this.form.getRawValue();
    const credentials = { username: value.username.trim().toLowerCase(), password: value.password };
    if (this.register)
      this.auth.register({ ...credentials, birthDate: value.birthDate }, this.returnUrl);
    else this.auth.login(credentials, this.returnUrl);
  }
  async retrySession(): Promise<void> {
    if (
      this.auth.snapshot().authenticationRequestId !== null ||
      this.auth.snapshot().restoreRequestId !== null
    )
      return;
    if (await firstValueFrom(this.auth.restore())) await this.router.navigateByUrl(this.returnUrl);
  }
  ngOnDestroy(): void {
    this.form.controls.password.reset();
    this.auth.clearForm();
  }
}
