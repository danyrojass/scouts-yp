import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {toSignal} from "@angular/core/rxjs-interop";
import {firstValueFrom, Observable, of} from 'rxjs';
import {catchError, map, switchMap} from "rxjs";

import {AuthService} from '../../../auth/services/auth.service';
import {ActivityService} from '../../services/activity.service';
import {ActivityCompletion} from '../../models';
import {User, UserType} from '../../../users/models';
import {SetService} from '../../../sets/services/set.service';
import {Set} from '../../../sets/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

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
    userSets = signal<Set[]>([]);
    
    private fb = inject(FormBuilder);
    
    completionForm: FormGroup<{
        activityId: FormControl<string>;
        setId: FormControl<string>;
        completedAt: FormControl<string>;
    }>;
    
    private activityService = inject(ActivityService);
    private authService = inject(AuthService);
    private setService = inject(SetService);
    private navigationService = inject(NavigationService);
    
    constructor() {
        this.completionForm = this.fb.group({
            activityId: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
            setId: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
            completedAt: this.fb.control('', {nonNullable: true, validators: [Validators.required]})
        });
    }
    
    activities = toSignal(
        this.authService.user$.pipe(
            switchMap(user => {
                if (!user) return of([]);
                if (user.type === UserType.JEFE) {
                    return this.activityService.getActivities().pipe(
                        map(activities => activities)
                    );
                }
                return this.activityService.getActivitiesByLevel(user.level).pipe(
                    map(activities => activities)
                );
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
                this.userSets.set(sets);
            }
        });
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
            earnedPoints: activity.points
        };
        
        try {
            await this.activityService.createCompletion(completion);
            this.successMessage.set('Actividad completada correctamente');
            this.completionForm.patchValue({
                activityId: '',
                setId: '',
                completedAt: new Date().toISOString().split('T')[0]
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