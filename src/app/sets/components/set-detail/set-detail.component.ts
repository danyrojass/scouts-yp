import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {SetService} from '../../services/set.service';
import {AuthService} from '../../../auth/services/auth.service';
import {Set} from '../../models';
import {User, UserType} from '../../../users/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-set-detail',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, AlertComponent],
  templateUrl: './set-detail.component.html',
  styleUrls: ['./set-detail.component.css']
})
export class SetDetailComponent implements OnInit {
  set: Set | null = null;
  currentUser: User | null = null;
  isLoading = true;
  errorMessage = '';
  protected readonly UserType = UserType;

  constructor(
    private route: ActivatedRoute,
    private router: NavigationService,
    private setService: SetService,
    private authService: AuthService
  ) {
  }

  ngOnInit() {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadSet(params['id']);
      }
    });
  }

  loadSet(id: string) {
    this.isLoading = true;
    this.setService.getSetById(id).subscribe({
      next: (set) => {
        this.set = set;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar la sección:', error);
        this.errorMessage = 'Ocurrió un error al cargar la sección';
        this.isLoading = false;
      }
    });
  }

  onEdit() {
    if (this.set?.id) {
      this.router.navigate(['/sets/edit', this.set.id]);
    }
  }

  onDelete() {
    if (!this.set?.id) return;

    if (confirm('Estás seguro de borrar la sección?')) {
      this.setService.deleteSet(this.set.id).subscribe({
        next: () => {
          this.router.navigate(['/sets']);
        },
        error: (error) => {
          console.error('Error al borrar la sección:', error);
          this.errorMessage = 'Ocurrió un error al borrar la sección';
        }
      });
    }
  }

  onBack() {
    this.router.navigate(['/sets']);
  }
}
