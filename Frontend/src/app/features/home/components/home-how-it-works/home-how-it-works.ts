import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-how-it-works',
  host: { class: 'block' },
  imports: [TranslatePipe],
  templateUrl: './home-how-it-works.html',
  styleUrl: './home-how-it-works.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHowItWorks {}
