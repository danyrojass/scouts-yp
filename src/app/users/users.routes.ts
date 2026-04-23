import {Routes} from '@angular/router';

export const USER_ROUTES: Routes = [
    {
        path: '',
        loadComponent: () => import('./components/user-list/user-list.component')
            .then(m => m.UserListComponent)
    },
    {
        path: 'import',
        loadComponent: () => import('./components/import-users/import-users.component')
            .then(m => m.ImportUsersComponent)
    },
    {
        path: 'new',
        loadComponent: () => import('./components/user-form/user-form.component')
            .then(m => m.UserFormComponent)
    },
    {
        path: 'edit/:id',
        loadComponent: () => import('./components/user-form/user-form.component')
            .then(m => m.UserFormComponent)
    },
    {
        path: ':id',
        loadComponent: () => import('./components/user-detail/user-detail.component')
            .then(m => m.UserDetailComponent)
    }
];
