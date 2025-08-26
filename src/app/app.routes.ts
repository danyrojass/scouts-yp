import {Routes} from '@angular/router';
import {authGuard} from './auth/auth.guard';

export const routes: Routes = [
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},

  // Auth
  {
    path: 'login',
    loadComponent: () => import('./auth/components/login/login.component')
      .then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/components/register/register.component')
      .then(m => m.RegisterComponent)
  },

  // Dashboard
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/components/dashboard.component')
      .then(m => m.DashboardComponent)
  },

  // Features (lazy load standalone routes)
  {
    path: 'users',
    canActivate: [authGuard],
    loadChildren: () => import('./users/users.routes')
      .then(m => m.USER_ROUTES)
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadChildren: () => import('./groups/groups.routes')
      .then(m => m.GROUP_ROUTES)
  },
  {
    path: 'sets',
    canActivate: [authGuard],
    loadChildren: () => import('./sets/sets.routes')
      .then(m => m.SET_ROUTES)
  },
  {
    path: 'activities',
    canActivate: [authGuard],
    loadChildren: () => import('./activities/activities.routes')
      .then(m => m.ACTIVITY_ROUTES)
  },

  // Fallback
  {path: '**', redirectTo: '/dashboard'}
];
