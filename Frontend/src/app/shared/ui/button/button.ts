import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
} from '@angular/core';

@Component({
  selector: 'button[appButton], a[appButton]',
  host: { '[class]': 'classes()', '[attr.type]': 'buttonType()' },
  templateUrl: './button.html',
  styleUrl: './button.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Button {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly buttonType = computed(() =>
    this.element.nativeElement.tagName === 'BUTTON' ? this.type() : null,
  );
  readonly variant = input<'primary' | 'outline' | 'text'>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
  protected readonly classes = computed(() => `btn btn-${this.variant()}`);
}
