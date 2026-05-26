import {Component, computed, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SetService} from '../../services/set.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, map, of, tap} from "rxjs";
import {Set, SetType} from "../../models";

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
    searchTerm = signal('');
    protected readonly UserType = UserType;
    private router = inject(NavigationService);
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private setService = inject(SetService);
    private currentUserValue = this.authService.user;

    private readonly typeOrder = Object.values(SetType);

    filteredSets = computed(() => {
        const term = this.searchTerm().toLowerCase().trim();
        if (!term) return this.sets();
        return this.sets().filter(s =>
            s.name.toLowerCase().includes(term) ||
            s.type.toLowerCase().includes(term)
        );
    });

    sets = toSignal(
        this.setService.getSets().pipe(
            map(sets => {
                const user = this.currentUserValue();
                let filtered = user?.type === UserType.DIRIGENTE
                    ? sets
                    : sets.filter(s => s.groupId === user?.groupId);
                return filtered.sort((a, b) =>
                    this.typeOrder.indexOf(a.type) - this.typeOrder.indexOf(b.type)
                );
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
