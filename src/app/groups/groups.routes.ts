import {Routes} from '@angular/router';

export const GROUP_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/group-list/group-list.component')
      .then(m => m.GroupListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/group-form/group-form.component')
      .then(m => m.GroupFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/group-form/group-form.component')
      .then(m => m.GroupFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/group-detail/group-detail.component')
      .then(m => m.GroupDetailComponent)
  }
];
