import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'app-home-hero',
  host: { class: 'block' },
  imports: [TranslatePipe, RouterLink],
  templateUrl: './home-hero.html',
  styleUrl: './home-hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeHero {}
