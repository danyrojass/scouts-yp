import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {UserService} from '../../services/user.service';
import {AuthService} from '../../../auth/services/auth.service';
import {User, UserType} from '../../models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.css']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  currentUser: User | null = null;
  isLoading: boolean = true;
  protected readonly UserType = UserType;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: NavigationService
  ) {
  }

  ngOnInit() {
    this.loadUsers();
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar usuarios:', error);
        this.isLoading = false;
      }
    });
  }

  onViewUser(id: string) {
    this.router.navigate(['/users', id]);
  }

  onEditUser(id: string) {
    this.router.navigate(['/users/edit', id]);
  }

  onDeleteUser(id: string) {
    if (confirm('Estás seguro de borrar este usuario?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error al borrar el usuario:', error);
        }
      });
    }
  }
}
