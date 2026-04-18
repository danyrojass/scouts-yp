import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class NavigationService {
  constructor(private router: Router) {
  }

  navigate(commands: any[], extras?: any): void {
    this.router.navigate(commands, extras).catch(err => {
      console.error('Error durante la navegación:', err);
    });
  }
}
