import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable } from '@angular/core';
import {
  TranslateLoader,
  TranslateService,
  provideTranslateLoader,
  provideTranslateService,
} from '@ngx-translate/core';
import { of } from 'rxjs';
import de from './translations/de.json';
import type { TranslationKey } from './translation-key';
import en from './translations/en.json';
export type Language = 'de' | 'en';
export function preferredLanguage(): Language {
  try {
    const stored = localStorage.getItem('smartspoon.language');
    if (stored === 'de' || stored === 'en') return stored;
  } catch {
    /* Storage can be unavailable in private browser contexts. */
  }
  return typeof navigator !== 'undefined' && navigator.language.startsWith('en') ? 'en' : 'de';
}
@Injectable()
export class CatalogLoader extends TranslateLoader {
  getTranslation(language: string) {
    return of(language === 'en' ? en : de);
  }
}
export function provideTranslations(language = preferredLanguage()) {
  return provideTranslateService({
    lang: language,
    fallbackLang: 'de',
    loader: provideTranslateLoader(CatalogLoader),
  });
}
@Injectable({ providedIn: 'root' })
export class I18nService {
  private readonly translate = inject(TranslateService);
  private readonly document = inject(DOCUMENT);
  readonly language = computed<Language>(() =>
    this.translate.currentLang() === 'en' ? 'en' : 'de',
  );
  readonly locale = computed(() => (this.language() === 'de' ? 'de-DE' : 'en-GB'));
  readonly dateFormat = computed(() => (this.language() === 'de' ? 'dd.MM.yyyy' : 'dd MMM yyyy'));
  readonly dateTimeFormat = computed(() =>
    this.language() === 'de' ? 'dd.MM.yyyy, HH:mm' : 'dd MMM yyyy, HH:mm',
  );
  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.language();
      this.document
        .querySelector('meta[name="description"]')
        ?.setAttribute('content', this.t('metadata.description'));
    });
  }
  t(key: TranslationKey, params?: Record<string, unknown>): string {
    this.language();
    return this.translate.instant(key, params) as string;
  }
  setLanguage(language: Language): void {
    this.translate.use(language).subscribe();
    try {
      localStorage.setItem('smartspoon.language', language);
    } catch {
      /* Keep switching functional without storage. */
    }
  }
}
