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
    // Despliegue de un único grupo: no hay registro público ni alta de grupos.
    {path: 'register', redirectTo: '/dashboard', pathMatch: 'full'},

    // Dashboard
    {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./dashboard/components/dashboard.component')
            .then(m => m.DashboardComponent)
    },
    {
        path: 'historial',
        canActivate: [authGuard],
        loadComponent: () => import('./history/components/history.component')
            .then(m => m.HistoryComponent)
    },

    // Features (lazy load standalone routes)
    {
        path: 'users',
        canActivate: [authGuard],
        loadChildren: () => import('./users/users.routes')
            .then(m => m.USER_ROUTES)
    },
    {path: 'groups', redirectTo: '/dashboard', pathMatch: 'full'},
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
