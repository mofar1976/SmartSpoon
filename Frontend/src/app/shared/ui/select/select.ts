import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'select[appSelect]',
  host: { class: 'field-control' },
  templateUrl: './select.html',
  styleUrl: './select.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Select {}
