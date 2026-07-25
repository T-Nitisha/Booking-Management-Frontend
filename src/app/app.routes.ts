import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'patient',
    canActivate: [authGuard],
    loadComponent: () => import('./features/patient/patient-booking.component').then(m => m.PatientBookingComponent)
  }
];
