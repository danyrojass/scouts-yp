import {inject} from '@angular/core';
import {CanActivateFn} from '@angular/router';
import {AuthService} from './services/auth.service';
import {NavigationService} from '../shared/services/navigation.service';
import {map, take, tap} from 'rxjs/operators';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(NavigationService);

  return authService.isAuthenticated().pipe(
    take(1),
    map(isAuth => !!isAuth),
    tap(isAuth => {
      if (!isAuth) {
        router.navigate(['/login']);
      }
    })
  );
};
