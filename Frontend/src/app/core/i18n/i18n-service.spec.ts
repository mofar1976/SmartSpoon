import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { I18nService, preferredLanguage, provideTranslations } from './i18n-service';
import de from './translations/de.json';
import type { TranslationKey } from './translation-key';
import en from './translations/en.json';
import { MultiSelect } from '../../shared/ui/multi-select/multi-select';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem('smartspoon.language');
});
describe('translations', () => {
  it('has matching keys and interpolation parameters in both catalogs', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(de).sort());
    for (const key of Object.keys(de) as TranslationKey[]) {
      expect(en[key].match(/{{\s*\w+\s*}}/g)?.sort() ?? []).toEqual(
        de[key].match(/{{\s*\w+\s*}}/g)?.sort() ?? [],
      );
    }
  });
  it('switches visible labels without resetting selected form values', () => {
    TestBed.configureTestingModule({ providers: [provideTranslations('de')] });
    const fixture = TestBed.createComponent(MultiSelect);
    fixture.componentRef.setInput('label', 'Allergies');
    fixture.componentRef.setInput('controlId', 'allergies');
    fixture.componentRef.setInput('options', [{ value: 'milk', label: 'Milk' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Keine ausgewählt');
    const service = TestBed.inject(I18nService);
    service.setLanguage('en');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('None selected');
    fixture.componentInstance.writeValue(['milk']);
    service.setLanguage('de');
    fixture.detectChanges();
    expect(fixture.componentInstance.selected()).toEqual(['milk']);
    expect(service.locale()).toBe('de-DE');
    expect(document.documentElement.lang).toBe('de');
    expect(localStorage.getItem('smartspoon.language')).toBe('de');
    service.setLanguage('en');
    fixture.detectChanges();
    expect(service.t('nav.greeting', { username: 'Alex' })).toBe('Hello, Alex');
    expect(service.locale()).toBe('en-GB');
    expect(document.documentElement.lang).toBe('en');
  });
  it('restores supported stored languages', () => {
    localStorage.setItem('smartspoon.language', 'en');
    expect(preferredLanguage()).toBe('en');
    localStorage.setItem('smartspoon.language', 'de');
    expect(preferredLanguage()).toBe('de');
    localStorage.setItem('smartspoon.language', 'fr');
    expect(['de', 'en']).toContain(preferredLanguage());
  });
  it('keeps switching functional when browser storage is blocked', () => {
    TestBed.configureTestingModule({ providers: [provideTranslations('de')] });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(['de', 'en']).toContain(preferredLanguage());
    const service = TestBed.inject(I18nService);
    expect(() => service.setLanguage('en')).not.toThrow();
    expect(service.language()).toBe('en');
    expect(service.t('errors.authCredentials')).toBe(en['errors.authCredentials']);
  });
});
