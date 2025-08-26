import {Routes} from '@angular/router';

export const ACTIVITY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/activity-list/activity-list.component')
      .then(m => m.ActivityListComponent)
  },
  {
    path: 'new',
    loadComponent: () => import('./components/activity-form/activity-form.component')
      .then(m => m.ActivityFormComponent)
  },
  {
    path: 'edit/:id',
    loadComponent: () => import('./components/activity-form/activity-form.component')
      .then(m => m.ActivityFormComponent)
  },
  {
    path: ':id',
    loadComponent: () => import('./components/activity-detail/activity-detail.component')
      .then(m => m.ActivityDetailComponent)
  }
];
