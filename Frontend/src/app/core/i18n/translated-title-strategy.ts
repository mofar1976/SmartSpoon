import { effect, inject, Injectable, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { I18nService } from './i18n-service';
import type { TranslationKey } from './translation-key';
@Injectable()
export class TranslatedTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly i18n = inject(I18nService);
  private readonly key = signal<TranslationKey>('titles.home');
  constructor() {
    super();
    effect(() => this.title.setTitle(this.i18n.t(this.key())));
  }
  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.key.set((this.buildTitle(snapshot) ?? 'titles.home') as TranslationKey);
  }
}
