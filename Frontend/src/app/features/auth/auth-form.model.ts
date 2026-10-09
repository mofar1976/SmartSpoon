import { FormControl, FormGroup } from '@angular/forms';
export type AuthForm = FormGroup<{
  username: FormControl<string>;
  password: FormControl<string>;
  birthDate: FormControl<string>;
}>;
