import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-auth-birth-date-field',
  host: { class: 'block' },
  imports: [TranslatePipe, ReactiveFormsModule],
  templateUrl: './auth-birth-date-field.html',
  styleUrl: './auth-birth-date-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthBirthDateField {
  readonly control = input.required<FormControl<string>>();
  readonly busy = input(false);
  readonly maxDate = input.required<string>();
}
