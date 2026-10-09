import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-username-field',
  host: { class: 'block' },
  imports: [TranslatePipe, ReactiveFormsModule],
  templateUrl: './auth-username-field.html',
  styleUrl: './auth-username-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthUsernameField {
  readonly control = input.required<FormControl<string>>();
  readonly busy = input(false);
}
