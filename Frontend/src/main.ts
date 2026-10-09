import { preferredLanguage } from './app/core/i18n/i18n-service';
import de from './app/core/i18n/translations/de.json';
import en from './app/core/i18n/translations/en.json';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app/app';

const language = preferredLanguage();
const catalog = language === 'en' ? en : de;
document.documentElement.lang = language;
document.title = catalog['titles.home'];
const loading = document.getElementById('app-loading');
if (loading) loading.textContent = catalog['common.loadingApp'];

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
