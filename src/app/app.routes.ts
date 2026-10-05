import { Routes } from '@angular/router';

import { PageLangData } from './core/i18n/page-lang';
import { PageSocialData } from './core/seo/page-social';

export const routes: Routes = [
  {
    path: '',
    title: 'Taco Tuesday — Interviews with a date, feedback in writing, and nobody left on read',
    data: { lang: 'en', card: 'home' } satisfies PageLangData & PageSocialData,
    loadComponent: () => import('./landing/landing').then((m) => m.Landing),
  },
  {
    path: 'talento',
    title: 'Para devs — Taco Tuesday',
    data: { lang: 'es-MX', card: 'talento' } satisfies PageLangData & PageSocialData,
    loadComponent: () => import('./pages/talent/talent').then((m) => m.Talent),
  },
  {
    path: 'privacidad',
    title: 'Aviso de privacidad — Taco Tuesday',
    data: { lang: 'es-MX', card: 'privacidad' } satisfies PageLangData & PageSocialData,
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
  },
  {
    path: 'health',
    title: 'API status — Taco Tuesday',
    data: { lang: 'en', card: 'health' } satisfies PageLangData & PageSocialData,
    loadComponent: () => import('./api/Health/health.component').then((m) => m.HealthComponent),
  },
  { path: '**', redirectTo: '' },
];
