import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'input[appInput]',
  host: { class: 'field-control' },
  templateUrl: './input.html',
  styleUrl: './input.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Input {}
