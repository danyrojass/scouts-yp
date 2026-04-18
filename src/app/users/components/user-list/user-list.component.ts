import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../../auth/services/auth.service';
import {User, UserType} from '../../models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, of, tap} from "rxjs";

@Component({
    selector: 'app-user-list',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './user-list.component.html',
    styleUrls: [
        './user-list.component.css',
        '../../../shared/styles/list-card.css'
    ]
})
export class UserListComponent {

    isLoading = signal(true);
    errorMessage = signal('');
    protected readonly UserType = UserType;
    private userService = inject(UserService);
    users = toSignal(this.userService.getUsers().pipe(
        tap(() => this.isLoading.set(false)),
        catchError(err => {
            console.error('Error al cargar los usuarios:', err);
            this.errorMessage.set('Ocurrió un error al cargar los usuarios');
            this.isLoading.set(false);
            return of([] as User[]);
        })
    ), {
        initialValue: []
    });
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private router = inject(NavigationService);

    onNewUser(): void {
        console.log('Navigating to new user');
        this.router.navigate(['/users/new']);
    }

    onViewUser(id: string): void {
        this.router.navigate(['/users', id]);
    }

    onEditUser(id: string): void {
        this.router.navigate(['/users/edit', id]);
    }

    async onDeleteUser(id: string): Promise<void> {
        if (!confirm('¿Estás seguro de borrar este usuario?')) return;

        this.userService.deleteUser(id)
            .then(() => {
                console.log('Usuario borrado correctamente');
            })
            .catch(err => {
                console.error('Error al borrar el usuario:', err);
                this.errorMessage.set('Ocurrió un error al borrar el usuario');
            });
    }
}
