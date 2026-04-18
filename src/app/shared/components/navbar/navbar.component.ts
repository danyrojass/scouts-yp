import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from "../../../auth/services/auth.service";


@Component({
    selector: 'app-navbar',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule
    ],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {

    isMenuOpen = signal(false);
    isLoggedIn = computed(() => !!this.user());
    private authService = inject(AuthService);
    user = this.authService.user;

    toggleMenu(): void {
        this.isMenuOpen.update(v => !v);
    }

    onLogout(): void {
        this.authService.logout();
        this.isMenuOpen.set(false);
    }
}
