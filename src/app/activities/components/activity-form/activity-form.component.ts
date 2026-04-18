import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ActivityService} from '../../services/activity.service';
import {Activity} from '../../models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {UserLevel} from '../../../users/models';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, filter, map, of, switchMap} from "rxjs";

@Component({
    selector: 'app-activity-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
    templateUrl: './activity-form.component.html',
    styleUrls: [
        './activity-form.component.css',
        '../../../shared/styles/form-card.css'
    ]
})
export class ActivityFormComponent {
    levels: string[] = Object.values(UserLevel);
    isLoading = signal(false);
    errorMessage = signal('');
    isEditing = signal(false);
    activityId = signal<string | null>(null);
    private fb = inject(FormBuilder);
    activityForm: FormGroup<{
        name: FormControl<string>;
        key: FormControl<string>;
        level: FormControl<UserLevel>;
        points: FormControl<number>;
    }> = this.fb.group({
        name: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
        key: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
        level: this.fb.control(UserLevel.LOBATO, {nonNullable: true, validators: [Validators.required]}),
        points: this.fb.control(0, {nonNullable: true, validators: [Validators.required, Validators.min(0)]})
    });
    private activityService = inject(ActivityService);
    private router = inject(NavigationService);
    private route = inject(ActivatedRoute);
    activity = toSignal(
        this.route.paramMap.pipe(
            map(params => params.get('id')),
            filter((id): id is string => id !== null),
            switchMap(id => {
                this.isEditing.set(true);
                this.activityId.set(id);
                this.isLoading.set(true);
                return this.activityService.getActivityById(id).pipe(
                    map(activity => {
                        if (activity) {
                            this.activityForm.patchValue(activity);
                        }
                        this.isLoading.set(false);
                        return activity;
                    }),
                    catchError(err => {
                        console.error('Error al cargar la actividad:', err);
                        this.errorMessage.set('Ocurrió un error al cargar la actividad');
                        this.isLoading.set(false);
                        return of(null);
                    })
                );
            })
        ),
        {initialValue: null}
    );

    async onSubmit() {
        if (this.activityForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const activityData: Activity = {
            ...this.activityForm.getRawValue(),
            createdAt: new Date()
        };

        try {
            if (this.isEditing() && this.activityId()) {
                await this.activityService.updateActivity(this.activityId()!, activityData);
            } else {
                await this.activityService.createActivity(activityData);
            }
            this.router.navigate(['/activities']);
        } catch (error) {
            console.error(error);
            this.errorMessage.set(
                this.isEditing()
                    ? 'Ocurrió un error al editar la actividad'
                    : 'Ocurrió un error al crear la actividad'
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    onCancel(): void {
        this.router.navigate(['/activities']);
    }
}
