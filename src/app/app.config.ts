import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { ThemeService } from './core/theme/theme.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
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
