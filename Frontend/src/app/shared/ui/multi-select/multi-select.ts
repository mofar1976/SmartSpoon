import { I18nService } from '../../../core/i18n/i18n-service';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-multi-select',
  host: { class: 'block min-w-0' },
  templateUrl: './multi-select.html',
  styleUrl: './multi-select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MultiSelect), multi: true },
  ],
})
export class MultiSelect implements ControlValueAccessor {
  private readonly i18n = inject(I18nService);
  readonly label = input.required<string>();
  readonly controlId = input.required<string>();
  readonly describedBy = input('');
  readonly options = input.required<readonly { value: string; label: string }[]>();
  readonly selected = signal<readonly string[]>([]);
  readonly disabled = signal(false);
  readonly opened = signal(false);
  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};

  selectedLabel(): string {
    return (
      this.options()
        .filter((option) => this.selected().includes(option.value))
        .map((option) => option.label)
        .join(', ') || this.i18n.t('common.noneSelected')
    );
  }
  writeValue(value: string[] | null): void {
    this.selected.set(value ? [...value] : []);
  }
  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }
  setDisabledState(disabled: boolean): void {
    this.disabled.set(disabled);
    if (disabled) this.opened.set(false);
  }
  toggle(): void {
    if (!this.disabled()) {
      this.opened.update((value) => !value);
      this.onTouched();
    }
  }
  select(value: string, checked: boolean): void {
    if (this.disabled() || !this.options().some((option) => option.value === value)) return;
    const values = new Set(this.selected());
    if (checked) values.add(value);
    else values.delete(value);
    this.selected.set([...values]);
    this.onChange([...values]);
    this.onTouched();
  }
  @HostListener('document:click', ['$event'])
  outside(event: MouseEvent): void {
    if (!this.element.nativeElement.contains(event.target as Node)) this.opened.set(false);
  }
  @HostListener('keydown.escape', ['$event'])
  escape(event: Event): void {
    if (this.opened()) {
      event.stopPropagation();
      this.opened.set(false);
      this.trigger()?.nativeElement.focus();
    }
  }
  @HostListener('focusout', ['$event'])
  blur(event: FocusEvent): void {
    if (!this.element.nativeElement.contains(event.relatedTarget as Node)) {
      this.opened.set(false);
      this.onTouched();
    }
  }
}
