import {
  ChangeDetectionStrategy,
  Component,
  effect,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { I18nService } from '../../../../core/i18n/i18n-service';
import { TranslationKey } from '../../../../core/i18n/translation-key';

@Component({
  selector: 'app-delete-selection-dialog',
  host: { class: 'block' },
  imports: [TranslatePipe],
  templateUrl: './delete-selection-dialog.html',
  styleUrl: './delete-selection-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteSelectionDialog {
  protected readonly i18n = inject(I18nService);
  readonly target = input<{ id: string; title: string } | null>(null);
  readonly busy = input(false);
  readonly errorKey = input<TranslationKey | null>(null);
  readonly cancelled = output<void>();
  readonly confirmed = output<void>();
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('deleteDialog');
  constructor() {
    effect(() => {
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;
      if (this.target()) {
        if (!dialog.open) dialog.showModal();
      } else dialog.close();
    });
  }
  protected onCancel(event: Event): void {
    event.preventDefault();
    if (!this.busy()) this.cancelled.emit();
  }
}
