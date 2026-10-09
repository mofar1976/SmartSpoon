import { firstValueFrom } from 'rxjs';
import { provideAppStore } from './shared/store/store.providers';
import {
  ApplicationConfig,
  LOCALE_ID,
  provideAppInitializer,
  inject,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { registerLocaleData } from '@angular/common';
import localeEn from '@angular/common/locales/en-GB';
import { I18nService, provideTranslations } from './core/i18n/i18n-service';
import { TranslatedTitleStrategy } from './core/i18n/translated-title-strategy';
import { TitleStrategy } from '@angular/router';
import localeDe from '@angular/common/locales/de';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './shared/interceptors/auth.interceptor';
import { AuthFacade } from './shared/store/auth/auth.facade';

registerLocaleData(localeDe);
registerLocaleData(localeEn);
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppStore(),
    provideTranslations(),
    provideAppInitializer(() => {
      inject(I18nService);
    }),
    { provide: TitleStrategy, useClass: TranslatedTitleStrategy },
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAppInitializer(() => firstValueFrom(inject(AuthFacade).restore())),
    { provide: LOCALE_ID, useValue: 'de-DE' },
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
  ],
};
