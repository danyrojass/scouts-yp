import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SetService} from '../../services/set.service';
import {AuthService} from '../../../auth/services/auth.service';
import {Set} from '../../models';
import {User, UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-set-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './set-list.component.html',
  styleUrls: ['./set-list.component.css']
})
export class SetListComponent implements OnInit {
  sets: Set[] = [];
  currentUser: User | null = null;
  isLoading: boolean = true;
  protected readonly UserType = UserType;

  constructor(
    private setService: SetService,
    private authService: AuthService,
    private router: NavigationService
  ) {
  }

  ngOnInit(): void {
    this.loadSets();
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  loadSets(): void {
    this.isLoading = true;
    this.setService.getSets().subscribe({
      next: (sets): void => {
        this.sets = sets;
        this.isLoading = false;
      },
      error: (error): void => {
        console.error('Error loading sets:', error);
        this.isLoading = false;
      }
    });
  }

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
    if (confirm('Are you sure you want to delete this set?')) {
      this.setService.deleteSet(id).subscribe({
        next: (): void => {
          this.loadSets();
        },
        error: (error): void => {
          console.error('Error deleting set:', error);
        }
      });
    }
  }
}
