import { Routes } from '@angular/router';
import { LayoutComponent } from './public/components/layout/layout';
import { BOOKING_ROUTES } from './booking/presentation/views/booking.routes';
import { TRIP_ROUTES } from './trip/presentation/views/trip.routes';
import { PLAN_ROUTES } from './plans/presentation/views/plan.routes';
import { GARAGE_ROUTES } from './garage/garage.routes';
import { USER_ROUTES } from './user/user.routes';
import { authGuard } from './core/services/auth.service';

export const routes: Routes = [
  { path: 'auth/login', loadComponent: () => import('./public/components/auth/login').then(m => m.LoginComponent) },
  { path: 'auth/email-login', loadComponent: () => import('./public/components/auth/auth').then(m => m.AuthComponent) },
  { path: 'auth/register', data: { register: true }, loadComponent: () => import('./public/components/auth/auth').then(m => m.AuthComponent) },
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./public/components/home/home').then(m => m.Home)
      },
      {
        path: 'vehicle-status',
        loadComponent: () => import('./booking/presentation/views/vehicle-unlock-status/vehicle-unlock-status').then(m => m.VehicleUnlockStatusComponent)
      },
      {
        path: 'schedule-unlock',
        loadComponent: () => import('./booking/presentation/views/schedule-unlock/schedule-unlock').then(m => m.ScheduleUnlockComponent)
      },
      {
        path: 'trip',
        children: TRIP_ROUTES
      },
      {
        path: 'booking',
        children: BOOKING_ROUTES
      },
      {
        path: 'plan',
        children: PLAN_ROUTES
      },
      {
        path: 'garage',
        children: GARAGE_ROUTES
      },
      {
        path: 'user',
        children: USER_ROUTES
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];
