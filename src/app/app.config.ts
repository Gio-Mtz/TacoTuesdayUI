import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import {
  TitleStrategy,
  UrlSerializer,
  provideRouter,
  withInMemoryScrolling,
} from '@angular/router';

import { apiBaseUrlInterceptor } from './api/api-base-url.interceptor';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { PageHeadStrategy } from './core/i18n/page-head-strategy';
import { ThemeService } from './core/theme/theme.service';
import { AnalyticsService } from './core/analytics/analytics.service';
import { TrailingSlashUrlSerializer } from './core/routing/trailing-slash';

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

    // US-018. `/talento/` parses to two segments, the second one empty, so it
    // matched no route and fell into the catch-all. This makes the trailing
    // slash disappear before the router ever sees it -- see the file for the
    // measurement.
    { provide: UrlSerializer, useClass: TrailingSlashUrlSerializer },

    provideAppInitializer(() => {
      inject(ThemeService);
      inject(AnalyticsService);
    }),
  ],
};
