import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../../auth/services/auth.service';
import {User, UserType} from '../../models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent, AlertComponent],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  user: User | null = null;
  currentUser: User | null = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  protected readonly UserType = UserType;

  constructor(
    private route: ActivatedRoute,
    private router: NavigationService,
    private userService: UserService,
    private authService: AuthService
  ) {
  }

  ngOnInit(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.loadUser(params['id']);
      }
    });
  }

  loadUser(id: string): void {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (user): void => {
        this.user = user;
        this.isLoading = false;
      },
      error: (error): void => {
        console.error('Error al cargar el usuario:', error);
        this.errorMessage = 'Ocurrió un error al cargar el usuario';
        this.isLoading = false;
      }
    });
  }

  onEdit(): void {
    if (this.user?.id) {
      this.router.navigate(['/users/edit', this.user.id]);
    }
  }

  onDelete(): void {
    if (!this.user?.id) return;

    if (confirm('Estás seguro de borrar este usuario?')) {
      this.userService.deleteUser(this.user.id).subscribe({
        next: (): void => {
          this.router.navigate(['/users']);
        },
        error: (error): void => {
          console.error('Error al borrar el usuario:', error);
          this.errorMessage = 'Ocurrió un error al borrar el usuario';
        }
      });
    }
  }

  onBack(): void {
    this.router.navigate(['/users']);
  }
}
