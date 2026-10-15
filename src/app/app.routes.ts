import { Routes } from '@angular/router';

import { Landing } from './landing/landing';
import { NotFound } from './pages/not-found/not-found';
import { PageLangData } from './core/i18n/page-lang';
import { PageSocialData } from './core/seo/page-social';
import { Privacy } from './pages/privacy/privacy';
import { Talent } from './pages/talent/talent';

// The public pages are eager on purpose: as lazy routes the arriving chunk
// pushed the footer 3460px down -- CLS 0.333, Lighthouse performance 82. Making
// them lazy again brings the shift back.
export const routes: Routes = [
  {
    path: '',
    title: 'Taco Tuesday — Interviews with a date, feedback in writing, and nobody left on read',
    data: { lang: 'en', card: 'home' } satisfies PageLangData & PageSocialData,
    component: Landing,
  },
  {
    path: 'talento',
    title: 'Para devs — Taco Tuesday',
    data: { lang: 'es-MX', card: 'talento' } satisfies PageLangData & PageSocialData,
    component: Talent,
  },
  {
    path: 'privacidad',
    title: 'Aviso de privacidad — Taco Tuesday',
    data: { lang: 'es-MX', card: 'privacidad' } satisfies PageLangData & PageSocialData,
    component: Privacy,
  },
  {
    // Eager for the same reason as the three above.
    path: 'privacy',
    title: 'Privacy notice — Taco Tuesday',
    data: { lang: 'en', card: 'privacy' } satisfies PageLangData & PageSocialData,
    component: Privacy,
  },
  {
    path: 'health',
    title: 'API status — Taco Tuesday',
    data: { lang: 'en', card: 'health' } satisfies PageLangData & PageSocialData,
    loadComponent: () => import('./api/Health/health.component').then((m) => m.HealthComponent),
  },
  {
    // A real address so the card has a route to describe. `dir: null` on purpose:
    // not emitted as a file, because Azure never serves it by name -- every
    // unknown URL arrives through the catch-all below.
    path: '404',
    title: 'Page not found — Taco Tuesday',
    data: { lang: 'en', card: 'notfound' } satisfies PageLangData & PageSocialData,
    component: NotFound,
  },
  {
    // Renders a page at the address that was asked for; it must never go back to
    // `redirectTo` -- that turned every wrong URL into the home page in silence.
    // Stays LAST: a catch-all above a real route eats it.
    path: '**',
    title: 'Page not found — Taco Tuesday',
    data: { lang: 'en', card: 'notfound' } satisfies PageLangData & PageSocialData,
    component: NotFound,
  },
];
