import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
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
    provideHttpClient(withFetch()),
    // Injected for its constructor: reading storage and writing `data-theme` is
    // what the service does on creation, and nothing else would create it.
    // Done at bootstrap rather than in a component so the theme is settled
    // before the first component renders.
    provideAppInitializer(() => {
      inject(ThemeService);
    }),
  ],
};
