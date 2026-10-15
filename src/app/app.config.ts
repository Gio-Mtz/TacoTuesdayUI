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
import { CanonicalPathUrlSerializer, knownFirstSegments } from './core/routing/canonical-path';

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

    // The router matches raw path segments: a trailing slash is a second, empty
    // segment, and `Talento` is not `talento`. Normalized here, before the
    // router matches, or a real page falls into the catch-all.
    {
      provide: UrlSerializer,
      useFactory: () => new CanonicalPathUrlSerializer(knownFirstSegments(routes)),
    },

    provideAppInitializer(() => {
      inject(ThemeService);
      inject(AnalyticsService);
    }),
  ],
};
