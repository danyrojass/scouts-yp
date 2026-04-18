import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {ActivityService} from '../../services/activity.service';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../../users/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {of} from 'rxjs';

@Component({
    selector: 'app-activity-detail',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent, AlertComponent],
    templateUrl: './activity-detail.component.html',
    styleUrls: [
        './activity-detail.component.css',
        '../../../shared/styles/detail-card.css'
    ]
})
export class ActivityDetailComponent {
    errorMessage = signal<string>('');
    isLoading = signal<boolean>(true);
    protected readonly UserType = UserType;
    private route = inject(ActivatedRoute);
    private activityService = inject(ActivityService);
    activity = toSignal(
        this.route.paramMap.pipe(
            switchMap(params => {
                const id = params.get('id');
                if (!id) {
                    this.isLoading.set(false);
                    return of(null);
                }
                this.isLoading.set(true);
                return this.activityService.getActivityById(id).pipe(
                    tap(() => this.isLoading.set(false)),
                    catchError(err => {
                        console.error('Error cargando la actividad:', err);
                        this.errorMessage.set('Ocurrió un error al cargar la actividad');
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
        const actividad = this.activity();
        if (actividad?.id) {
            this.router.navigate(['/activities/edit', actividad.id]);
        }
    }

    onDelete(): void {
        const act = this.activity();
        if (!act?.id) return;

        if (confirm('¿Estás seguro de borrar esta actividad?')) {
            this.activityService.deleteActivity(act.id)
                .then(() => this.router.navigate(['/activities']))
                .catch(err => {
                    console.error('Error al borrar la actividad:', err);
                    this.errorMessage.set('Ocurrió un error al borrar la actividad');
                });
        }
    }

    onBack(): void {
        this.router.navigate(['/activities']);
    }
}
