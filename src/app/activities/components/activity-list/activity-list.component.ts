import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivityService} from '../../services/activity.service';
import {Activity} from '../../models';
import {AuthService} from '../../../auth/services/auth.service';
import {User, UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-activity-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './activity-list.component.html',
  styleUrls: ['./activity-list.component.css']
})
export class ActivityListComponent implements OnInit {
  activities: Activity[] = [];
  currentUser: User | null = null;
  isLoading: boolean = true;
  protected readonly UserType = UserType;

  constructor(
    private activityService: ActivityService,
    private authService: AuthService,
    private router: NavigationService
  ) {
  }

  ngOnInit(): void {
    this.loadActivities();
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  loadActivities(): void {
    this.isLoading = true;
    this.activityService.getActivities().subscribe({
      next: (activities): void => {
        this.activities = activities;
        this.isLoading = false;
      },
      error: (error): void => {
        console.error('Error al cargar actividades:', error);
        this.isLoading = false;
      }
    });
  }

  onCreateActivity(): void {
    this.router.navigate(['/activities/new']);
  }

  onEditActivity(id: string): void {
    this.router.navigate(['/activities/edit', id]);
  }

  onDeleteActivity(id: string): void {
    if (confirm('Estás seguro de borrar esta actividad?')) {
      this.activityService.deleteActivity(id).subscribe({
        next: (): void => {
          this.loadActivities();
        },
        error: (error): void => {
          console.error('Error al borrar la actividad:', error);
        }
      });
    }
  }
}
