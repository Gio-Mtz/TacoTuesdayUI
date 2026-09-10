import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'health',
    loadComponent: () => import('./api/Health/health.component').then((m) => m.HealthComponent),
  },
];
