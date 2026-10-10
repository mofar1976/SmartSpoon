import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import {
  SavableRecipeResult,
  SaveViewModel,
} from '../../../features/saved-recipes/saved-recipes.models';
@Component({
  selector: 'app-save-selection-form',
  imports: [TranslatePipe, ReactiveFormsModule, RouterLink],
  templateUrl: './save-selection.html',
  styleUrl: './save-selection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveSelectionForm {
  readonly result = input.required<SavableRecipeResult>();
  readonly state = input.required<SaveViewModel>();
  readonly saveRequested = output<string>();
  readonly title = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.maxLength(120),
      (c) => (typeof c.value === 'string' && c.value.trim() ? null : { blank: true }),
    ],
  });
  constructor() {
    effect(() => this.title.reset(this.result().recipes[0]?.title ?? ''));
    effect(() => {
      const vm = this.state();
      if (vm.savedId && vm.savedTitle) this.title.setValue(vm.savedTitle);
    });
  }
  save() {
    if (this.state().busy || this.state().savedId || !this.result().saveProof) return;
    this.title.markAsTouched();
    if (this.title.valid) this.saveRequested.emit(this.title.value.trim());
  }
}
