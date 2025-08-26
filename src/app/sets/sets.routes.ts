import {Routes} from '@angular/router';

export const SET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/set-list/set-list.component')
      .then(m => m.SetListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/set-form/set-form.component')
      .then(m => m.SetFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/set-form/set-form.component')
      .then(m => m.SetFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/set-detail/set-detail.component')
      .then(m => m.SetDetailComponent)
  }
];
