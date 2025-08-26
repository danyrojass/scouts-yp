import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../../auth/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  isLoggedIn = signal(false);
  isMenuOpen = signal(false);

  constructor(private authService: AuthService) {
  }

  ngOnInit(): void {
    this.authService.user$.subscribe(user => {
      this.isLoggedIn.set(!!user);
    });
  }

  toggleMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen);
  }

  onLogout(): void {
    this.authService.logout();
    this.isMenuOpen.set(false);
  }
}
