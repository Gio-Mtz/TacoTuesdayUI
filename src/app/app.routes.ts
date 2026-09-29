import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Taco Tuesday — Entrevistas con fecha, con feedback y sin silencios',
    loadComponent: () => import('./landing/landing').then((m) => m.Landing),
  },
  {
    path: 'privacidad',
    title: 'Aviso de privacidad — Taco Tuesday',
    loadComponent: () => import('./pages/privacy/privacy').then((m) => m.Privacy),
  },
  {
    // Kept from US-001. It is the only screen that proves the UI can reach the
    // API, so it stays until US-006 wires the real calls and can prove it from
    // the landing instead.
    path: 'health',
    title: 'Estado de la API — Taco Tuesday',
    loadComponent: () => import('./api/Health/health.component').then((m) => m.HealthComponent),
  },
  { path: '**', redirectTo: '' },
];
