import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SetService} from '../../services/set.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, map, of, tap} from "rxjs";
import {Set} from "../../models";

@Component({
    selector: 'app-set-list',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './set-list.component.html',
    styleUrls: [
        './set-list.component.css',
        '../../../shared/styles/list-card.css'
    ]
})
export class SetListComponent {

    isLoading = signal(true);
    errorMessage = signal('');
    protected readonly UserType = UserType;
    private router = inject(NavigationService);
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private setService = inject(SetService);
    private currentUserValue = this.authService.user;

    sets = toSignal(
        this.setService.getSets().pipe(
            map(sets => {
                const user = this.currentUserValue();
                if (user?.type === UserType.JEFE) return sets;
                return sets.filter(s => s.groupId === user?.groupId);
            }),
            tap(() => this.isLoading.set(false)),
            catchError(err => {
                console.error('Error al cargar las secciones:', err);
                this.errorMessage.set('Ocurrió un error al cargar las secciones');
                this.isLoading.set(false);
                return of([] as Set[]);
            })
        ),
        {initialValue: []}
    );

    onCreateSet(): void {
        this.router.navigate(['/sets/new']);
    }

    onViewSet(id: string): void {
        this.router.navigate(['/sets', id]);
    }

    onEditSet(id: string): void {
        this.router.navigate(['/sets/edit', id]);
    }

    onDeleteSet(id: string): void {
        if (!confirm('¿Estás seguro de borrar esta sección?')) return;

        this.setService.deleteSet(id)
            .then(() => {
                console.log('Sección borrada correctamente');
            })
            .catch(err => {
                console.error('Error al borrar la sección:', err);
                this.errorMessage.set('Ocurrió un error al borrar la sección');
            });
    }
}
