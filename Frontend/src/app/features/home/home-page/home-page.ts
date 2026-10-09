import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HomeHero } from '../components/home-hero/home-hero';
import { HomeHowItWorks } from '../components/home-how-it-works/home-how-it-works';
import { HomePriceNotice } from '../components/home-price-notice/home-price-notice';

@Component({
  imports: [HomeHero, HomeHowItWorks, HomePriceNotice],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {}
