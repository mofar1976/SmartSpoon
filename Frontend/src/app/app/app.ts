import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppShell } from '../layout/app-shell/app-shell';

@Component({
  selector: 'app-root',
  host: { class: 'block' },
  imports: [AppShell],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
