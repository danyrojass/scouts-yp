import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from "@angular/core/rxjs-interop";
import {firstValueFrom, of} from 'rxjs';
import {catchError, map, switchMap} from "rxjs";

import {AuthService} from '../../../auth/services/auth.service';
import {ActivityService} from '../../services/activity.service';
import {ActivityCompletion} from '../../models';
import {Activity} from '../../models';
import {User, UserType} from '../../../users/models';
import {SetService} from '../../../sets/services/set.service';
import {Set} from '../../../sets/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {getSetsForLevel} from '../../../shared/utils/level-settype.util';

@Component({
    selector: 'app-activity-complete',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
    templateUrl: './activity-complete.component.html',
    styleUrls: [
        './activity-complete.component.css',
        '../../../shared/styles/form-card.css'
    ]
})
export class ActivityCompleteComponent implements OnInit {
    isLoading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    currentUser = signal<User | null>(null);
    allUserSets = signal<Set[]>([]);
    selectedActivityId = signal('');

    private fb = inject(FormBuilder);

    completionForm: FormGroup<{
        activityId: FormControl<string>;
        setId: FormControl<string>;
        completedAt: FormControl<string>;
        earnedPoints: FormControl<number>;
    }>;

    private activityService = inject(ActivityService);
    private authService = inject(AuthService);
    private setService = inject(SetService);
    private navigationService = inject(NavigationService);

    constructor() {
        this.completionForm = this.fb.group({
            activityId: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
            setId: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
            completedAt: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
            earnedPoints: this.fb.control(0, {nonNullable: true, validators: [Validators.required, Validators.min(0)]})
        });
    }

    selectedActivity = computed(() => {
        const id = this.selectedActivityId();
        if (!id) return null;
        return this.activities().find(a => a.id === id) ?? null;
    });

    maxPoints = computed(() => this.selectedActivity()?.points ?? 0);

    filteredSets = computed(() => {
        const activity = this.selectedActivity();
        if (!activity) return this.allUserSets();
        return getSetsForLevel(this.allUserSets(), activity.level);
    });

    activities = toSignal(
        this.authService.user$.pipe(
            switchMap(user => {
                if (!user) return of([]);
                if (user.type === UserType.DIRIGENTE) {
                    return this.activityService.getActivities();
                }
                return this.activityService.getActivitiesByLevel(user.level);
            }),
            catchError(err => {
                console.error('Error loading activities:', err);
                return of([]);
            })
        ),
        {initialValue: []}
    );

    ngOnInit(): void {
        this.authService.user$.subscribe(async user => {
            this.currentUser.set(user);

            if (user?.setId) {
                this.completionForm.patchValue({
                    setId: user.setId,
                    completedAt: new Date().toISOString().split('T')[0]
                });
            }

            if (user?.groupId) {
                const sets = await firstValueFrom(this.setService.getSetsByGroup(user.groupId));
                this.allUserSets.set(sets);
            }
        });

        this.completionForm.get('activityId')!.valueChanges.subscribe(id => {
            this.selectedActivityId.set(id ?? '');
            this.completionForm.patchValue({setId: '', earnedPoints: 0});
        });
    }

    onPointsInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        let val = parseInt(input.value, 10);
        if (isNaN(val)) val = 0;
        const max = this.maxPoints();
        if (val > max) val = max;
        if (val < 0) val = 0;
        this.completionForm.patchValue({earnedPoints: val});
    }

    async onSubmit() {
        if (this.completionForm.invalid) {
            this.completionForm.markAllAsTouched();
            return;
        }

        const activityId = this.completionForm.value.activityId ?? '';
        const setId = this.completionForm.value.setId ?? '';

        const activity = this.activities().find(a => a.id === activityId);

        if (!activity) {
            this.errorMessage.set('Actividad no encontrada');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const completion: ActivityCompletion = {
            activityId,
            setId,
            userId: this.currentUser()?.id ?? '',
            completedAt: new Date(this.completionForm.value.completedAt!),
            earnedPoints: this.completionForm.value.earnedPoints ?? 0
        };

        try {
            await this.activityService.createCompletion(completion);
            this.successMessage.set('Actividad completada correctamente');
            this.completionForm.patchValue({
                activityId: '',
                setId: '',
                completedAt: new Date().toISOString().split('T')[0],
                earnedPoints: 0
            });
        } catch (error) {
            console.error('Error completing activity:', error);
            this.errorMessage.set('Ocurrió un error al completar la actividad');
        } finally {
            this.isLoading.set(false);
        }
    }

    onCancel(): void {
        this.navigationService.navigate(['/dashboard']);
    }
}
