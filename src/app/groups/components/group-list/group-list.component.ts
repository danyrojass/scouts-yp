import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {toSignal} from '@angular/core/rxjs-interop';
import {GroupService} from '../../services/group.service';
import {AuthService} from '../../../auth/services/auth.service';
import {Group} from '../../models';
import {UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {catchError, of, tap} from 'rxjs';

@Component({
    selector: 'app-group-list',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './group-list.component.html',
    styleUrls: [
        './group-list.component.css',
        './/../../../shared/styles/list-card.css'
    ]
})
export class GroupListComponent {

    isLoading = signal(true);
    errorMessage = signal('');
    protected readonly UserType = UserType;
    private router = inject(NavigationService);
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private groupService = inject(GroupService);
    groups = toSignal(
        this.groupService.getGroups().pipe(
            tap(() => this.isLoading.set(false)),
            catchError(err => {
                console.error('Error al cargar los grupos:', err);
                this.errorMessage.set('Ocurrió un error al cargar los grupos');
                this.isLoading.set(false);
                return of([] as Group[]);
            })
        ),
        {initialValue: []}
    );

    onCreateGroup(): void {
        this.router.navigate(['/groups/new']);
    }

    onViewGroup(id: string): void {
        this.router.navigate(['/groups', id]);
    }

    onEditGroup(id: string): void {
        this.router.navigate(['/groups/edit', id]);
    }

    onDeleteGroup(id: string): void {
        if (!confirm('¿Estás seguro de borrar este grupo?')) return;

        this.groupService.deleteGroup(id)
            .then(() => {
                console.log('Grupo borrado correctamente');
            })
            .catch(err => {
                console.error('Error al borrar el grupo:', err);
                this.errorMessage.set('Ocurrió un error al borrar el grupo');
            });
    }
}
