import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, switchMap, tap} from "rxjs/operators";
import {of} from "rxjs";

@Component({
    selector: 'app-user-detail',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, AlertComponent],
    templateUrl: './user-detail.component.html',
    styleUrls: [
        './user-detail.component.css',
        '../../../shared/styles/detail-card.css'
    ]
})
export class UserDetailComponent {

    errorMessage = signal<string>('');
    isLoading = signal<boolean>(true);
    protected readonly UserType = UserType;
    private route = inject(ActivatedRoute);
    private userService = inject(UserService);
    user = toSignal(
        this.route.paramMap.pipe(
            switchMap(params => {
                const id = params.get('id');
                if (!id) {
                    this.isLoading.set(false);
                    return of(null);
                }
                this.isLoading.set(true);
                return this.userService.getUserById(id).pipe(
                    tap(() => this.isLoading.set(false)),
                    catchError(err => {
                        console.error('Error cargando el usuario:', err);
                        this.errorMessage.set('Ocurrió un error al cargar el usuario');
                        this.isLoading.set(false);
                        return of(null);
                    })
                );
            })
        ),
        {initialValue: null}
    );
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private router = inject(NavigationService);

    onEdit(): void {
        const user = this.user();
        if (user?.id) {
            this.router.navigate(['/users/edit', user.id]);
        }
    }

    onDelete(): void {
        const user = this.user();
        if (!user?.id) {
            return;
        }

        if (confirm('Estás seguro de borrar este usuario?')) {
            this.userService.deleteUser(user.id)
                .then(() => this.router.navigate(['/users']))
                .catch(err => {
                    console.error('Error al borrar el usuario:', err);
                    this.errorMessage.set('Ocurrió un error al borrar el usuario');
                });

        }
    }

    onBack(): void {
        this.router.navigate(['/users']);
    }
}
