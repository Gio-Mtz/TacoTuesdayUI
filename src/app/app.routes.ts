import { Routes } from '@angular/router';

import { Landing } from './landing/landing';
import { PageLangData } from './core/i18n/page-lang';
import { PageSocialData } from './core/seo/page-social';
import { Privacy } from './pages/privacy/privacy';
import { Talent } from './pages/talent/talent';

// GUARD, not documentation: the three public pages are eager on purpose. As lazy
// routes the shell painted an empty <main>, the footer landed inside the viewport,
// and the chunk arriving pushed it 3460px down - CLS 0.333, which alone held
// Lighthouse performance at 82. Making them lazy again brings the shift back.
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
    // Eager for the same reason as the three above: it is a public page, and a
    // lazy chunk arriving after the shell is what put CLS at 0.333.
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
  { path: '**', redirectTo: '' },
];
