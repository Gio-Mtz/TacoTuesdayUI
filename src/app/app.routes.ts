import { Routes } from '@angular/router';

import { PageLangData } from './core/i18n/page-lang';

/**
 * `data.lang` is not decoration: `PageHeadStrategy` reads it to set
 * `<html lang>` and to pick the shell's copy. It is typed through
 * `PageLangData` so a typo becomes a compile error instead of a screen reader
 * reading Spanish with English phonemes.
 *
 * `title` and `lang` have to agree. A route whose title is in English and whose
 * `lang` says `es-MX` is not half-right, it is wrong twice.
 */
export const routes: Routes = [
  {
    path: '',
    title: 'Taco Tuesday — Interviews with a date, feedback in writing, and nobody left on read',
    data: { lang: 'en' } satisfies PageLangData,
    loadComponent: () => import('./landing/landing').then((m) => m.Landing),
  },
  {
    // Spanish, and the brand line survives verbatim here. `/` carries a
    // translated version of it for the buyer who lands there; this is the page
    // the engineer is actually sent to. US-010, and the reasoning is in the
    // component's docblock and ADR 0007.
    path: 'talento',
    title: 'Para devs — Taco Tuesday',
    data: { lang: 'es-MX' } satisfies PageLangData,
    loadComponent: () => import('./pages/talent/talent').then((m) => m.Talent),
  },
  {
    // Stays Spanish, and that is not an oversight: a Mexican aviso de privacidad
    // is written in Spanish because the LFPDPPP addresses a Spanish-speaking data
    // subject. The path stays Spanish with it. The footer link that reaches it
    // carries `hreflang="es-MX"` so the change of language is announced.
    path: 'privacidad',
    title: 'Aviso de privacidad — Taco Tuesday',
    data: { lang: 'es-MX' } satisfies PageLangData,
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
  },
  {
    // Kept from US-001. It is the only screen that proves the UI can reach the
    // API, so it stays until US-006 wires the real calls and can prove it from
    // the landing instead. Its own copy has always been English.
    path: 'health',
    title: 'API status — Taco Tuesday',
    data: { lang: 'en' } satisfies PageLangData,
    loadComponent: () => import('./api/Health/health.component').then((m) => m.HealthComponent),
  },
  { path: '**', redirectTo: '' },
];
