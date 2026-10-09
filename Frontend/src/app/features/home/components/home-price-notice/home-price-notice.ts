import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-price-notice',
  host: { class: 'block' },
  imports: [TranslatePipe],
  templateUrl: './home-price-notice.html',
  styleUrl: './home-price-notice.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePriceNotice {}
