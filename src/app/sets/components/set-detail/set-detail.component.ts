import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../../users/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {SetService} from "../../services/set.service";
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, switchMap, tap} from "rxjs/operators";
import {of} from "rxjs";

@Component({
    selector: 'app-set-detail',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, AlertComponent],
    templateUrl: './set-detail.component.html',
    styleUrls: [
        './set-detail.component.css',
        '../../../shared/styles/detail-card.css'
    ]
})
export class SetDetailComponent {
    errorMessage = signal<string>('');
    isLoading = signal<boolean>(true);
    protected readonly UserType = UserType;
    private route = inject(ActivatedRoute);
    private setService = inject(SetService);
    set = toSignal(
        this.route.paramMap.pipe(
            switchMap(params => {
                const id = params.get('id');
                if (!id) {
                    this.isLoading.set(false);
                    return of(null);
                }
                this.isLoading.set(true);
                return this.setService.getSetById(id).pipe(
                    tap(() => this.isLoading.set(false)),
                    catchError(err => {
                        console.error('Error cargando la sección:', err);
                        this.errorMessage.set('Ocurrió un error al cargar la sección');
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
        const actividad = this.set();
        if (actividad?.id) {
            this.router.navigate(['/sets/edit', actividad.id]);
        }
    }

    onDelete(): void {
        const act = this.set();
        if (!act?.id) return;

        if (confirm('¿Estás seguro de borrar esta sección?')) {
            this.setService.deleteSet(act.id)
                .then(() => this.router.navigate(['/sets']))
                .catch(err => {
                    console.error('Error al borrar la sección:', err);
                    this.errorMessage.set('Ocurrió un error al borrar la sección');
                });
        }
    }

    onBack(): void {
        this.router.navigate(['/sets']);
    }
}
