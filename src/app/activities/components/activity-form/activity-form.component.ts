import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {ActivityService} from '../../services/activity.service';
import {Activity} from '../../models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {UserLevel} from '../../../users/models';

@Component({
  selector: 'app-activity-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
  templateUrl: './activity-form.component.html',
  styleUrls: ['./activity-form.component.css']
})
export class ActivityFormComponent implements OnInit {
  activityForm!: FormGroup;
  isLoading: boolean = false;
  isEditing: boolean = false;
  activityId: string | null = null;
  errorMessage: string = '';

  levels: string[] = Object.values(UserLevel);

  constructor(
    private fb: FormBuilder,
    private activityService: ActivityService,
    private router: NavigationService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.initForm();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.activityId = params['id'];
        this.loadActivity(this.activityId);
      }
    });
  }

  initForm(): void {
    this.activityForm = this.fb.group({
      name: ['', [Validators.required]],
      key: ['', [Validators.required]],
      level: [UserLevel.LOBATO, [Validators.required]],
      points: [0, [Validators.required, Validators.min(0)]]
    });
  }

  loadActivity(id: string | null) {
    this.isLoading = true;
    this.activityService.getActivityById(id).subscribe({
      next: (activity): void => {
        this.activityForm.patchValue(activity);
        this.isLoading = false;
      },
      error: (error): void => {
        console.error('Error al cargar la actividad:', error);
        this.errorMessage = 'Ocurrió un error al cargar la actividad';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.activityForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const activityData: Activity = {
      ...this.activityForm.value,
      createdAt: new Date()
    };

    if (this.isEditing && this.activityId) {
      this.activityService.updateActivity(this.activityId, activityData).subscribe({
        next: (): void => {
          this.router.navigate(['/activities']);
        },
        error: (error): void => {
          console.error('Error al editar la actividad:', error);
          this.errorMessage = 'Ocurrió un error al editar la actividad';
          this.isLoading = false;
        }
      });
    } else {
      this.activityService.createActivity(activityData).subscribe({
        next: (): void => {
          this.router.navigate(['/activities']);
        },
        error: (error): void => {
          console.error('Error al crear la actividad:', error);
          this.errorMessage = 'Ocurrió un error al crear la actividad';
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/activities']);
  }
}
