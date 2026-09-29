import { Routes } from '@angular/router';

export const routes: Routes = [
  // Temporary: the root has no landing page yet (US-002), so it redirects to the
  // only screen that exists. Replace this with the landing route in US-002.
  { path: '', redirectTo: 'health', pathMatch: 'full' },
  {
    path: 'health',
    loadComponent: () => import('./api/Health/health.component').then((m) => m.HealthComponent),
  },
  { path: '**', redirectTo: '' },
];
