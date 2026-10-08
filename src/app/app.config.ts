import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { TitleStrategy, provideRouter, withInMemoryScrolling } from '@angular/router';

import { apiBaseUrlInterceptor } from './api/api-base-url.interceptor';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { PageHeadStrategy } from './core/i18n/page-head-strategy';
import { ThemeService } from './core/theme/theme.service';
import { AnalyticsService } from './core/analytics/analytics.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),

    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),

    provideHttpClient(withFetch(), withInterceptors([apiBaseUrlInterceptor])),

    { provide: TitleStrategy, useExisting: PageHeadStrategy },

    provideAppInitializer(() => {
      inject(ThemeService);
      inject(AnalyticsService);
    }),
  ],
};
