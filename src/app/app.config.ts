import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { apiBaseUrlInterceptor } from './api/api-base-url.interceptor';
import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // `anchorScrolling` is what makes routerLink + fragment actually scroll:
    // without it the header's "Empresas" link navigates and the page sits
    // still. `scrollPositionRestoration` puts the visitor back where they were
    // when they hit Back instead of at the top of the landing.
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      }),
    ),
    // `withInterceptors` is what makes the relative `/api` URLs in the services
    // absolute in production. It is registered here and nowhere else: the specs
    // build their own `provideHttpClient()` without it, which is why they keep
    // asserting on relative URLs and why adding this changed none of them.
    // See `api/api-base-url.interceptor.ts` and ADR 0004.
    provideHttpClient(withFetch(), withInterceptors([apiBaseUrlInterceptor])),
    // Injected for its constructor: reading storage and writing `data-theme` is
    // what the service does on creation, and nothing else would create it.
    // Done at bootstrap rather than in a component so the theme is settled
    // before the first component renders.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ],
};
