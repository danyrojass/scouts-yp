import {inject} from '@angular/core';
import {CanActivateFn} from '@angular/router';
import {AuthService} from './services/auth.service';
import {NavigationService} from '../shared/services/navigation.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(AuthService);
    const router = inject(NavigationService);

    const user = authService.user();

    if (user === null) {
        router.navigate(['/login']);
        return false;
    }

    return true;
};

