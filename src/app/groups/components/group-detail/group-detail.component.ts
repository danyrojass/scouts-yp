import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {GroupService} from '../../services/group.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../../users/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {of} from 'rxjs';

@Component({
    selector: 'app-group-detail',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, AlertComponent],
    templateUrl: './group-detail.component.html',
    styleUrls: [
        './group-detail.component.css',
        '../../../shared/styles/detail-card.css'
    ]
})
export class GroupDetailComponent {
    isLoading = signal(false);
    errorMessage = signal('');
    protected readonly UserType = UserType;
    private route = inject(ActivatedRoute);
    private router = inject(NavigationService);
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private groupService = inject(GroupService);
    group = toSignal(
        this.route.paramMap.pipe(
            switchMap(params => {
                const id = params.get('id');
                if (!id) {
                    this.isLoading.set(false);
                    return of(null);
                }
                this.isLoading.set(true);
                return this.groupService.getGroupById(id).pipe(
                    tap(() => this.isLoading.set(false)),
                    catchError(err => {
                        console.error('Error cargando el grupo:', err);
                        this.errorMessage.set('Ocurrió un error al cargar el grupo');
                        this.isLoading.set(false);
                        return of(null);
                    })
                );
            })
        ),
        {initialValue: null}
    );

    onEdit(): void {
        const group = this.group();
        if (group?.id) {
            this.router.navigate(['/groups/edit', group.id]);
        }
    }

    onDelete(): void {
        const group = this.group();
        if (!group?.id) return;

        if (confirm('¿Estás seguro de borrar este grupo?')) {
            this.groupService.deleteGroup(group.id)
                .then(() => this.router.navigate(['/groups']))
                .catch(err => {
                    console.error('Error al borrar el grupo:', err);
                    this.errorMessage.set('Ocurrió un error al borrar el grupo');
                });
        }
    }

    onBack(): void {
        this.router.navigate(['/groups']);
    }
}