import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {AuthService} from '../../../auth/services/auth.service';
import {UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, of, tap} from "rxjs";
import {ActivityService} from "../../services/activity.service";
import {Activity} from "../../models";

@Component({
    selector: 'app-activity-list',
    standalone: true,
    imports: [CommonModule, LoadingSpinnerComponent],
    templateUrl: './activity-list.component.html',
    styleUrls: [
        './activity-list.component.css',
        './/../../../shared/styles/list-card.css'
    ]
})
export class ActivityListComponent {

    isLoading = signal(true);
    errorMessage = signal('');
    protected readonly UserType = UserType;
    private router = inject(NavigationService);
    private authService = inject(AuthService);
    currentUser = this.authService.user;
    private activityService = inject(ActivityService);
    activities = toSignal(
        this.activityService.getActivities().pipe(
            tap(() => this.isLoading.set(false)),
            catchError(err => {
                console.error('Error al cargar las actividades:', err);
                this.errorMessage.set('Ocurrió un error al cargar las actividades');
                this.isLoading.set(false);
                return of([] as Activity[]);
            })
        ),
        {initialValue: []}
    );

    onCreateActivity(): void {
        this.router.navigate(['/activities/new']);
    }

    onViewActivity(id: string): void {
        this.router.navigate(['/activities', id]);
    }

    onEditActivity(id: string): void {
        this.router.navigate(['/activities/edit', id]);
    }

    onDeleteActivity(id: string): void {
        if (!confirm('¿Estás seguro de borrar esta actividad?')) return;

        this.activityService.deleteActivity(id)
            .then(() => {
                console.log('Actividad borrada correctamente');
            })
            .catch(err => {
                console.error('Error al borrar la actividad:', err);
                this.errorMessage.set('Ocurrió un error al borrar la actividad');
            });
    }
}
