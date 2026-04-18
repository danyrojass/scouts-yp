import {Component, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {GroupService} from '../../services/group.service';
import {AuthService} from '../../../auth/services/auth.service';
import {Group} from '../../models';
import {User, UserType} from '../../../users/models';
import {LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, LoadingSpinnerComponent],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent implements OnInit {
  groups: Group[] = [];
  currentUser: User | null = null;
  isLoading = signal(true);
  protected readonly UserType = UserType;

  constructor(
    private groupService: GroupService,
    private authService: AuthService,
    private router: NavigationService
  ) {
  }

  ngOnInit(): void {
    this.loadGroups();
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  loadGroups(): void {
    this.isLoading.set(true);
    this.groupService.getGroups().subscribe({
      next: (groups): void => {
        this.groups = groups;
        this.isLoading.set(false);
      },
      error: (error): void => {
        console.error('Error al cargar los grupos:', error);
        this.isLoading.set(false);
      }
    });
  }

  onCreateGroup(): void {
    this.router.navigate(['/groups/new']);
  }

  onViewGroup(id: string): void {
    this.router.navigate(['/groups', id]);
  }

  onEditGroup(id: string): void {
    this.router.navigate(['/groups/edit', id]);
  }

  onDeleteGroup(id: string): void {
    if (!confirm('¿Estás seguro de borrar este grupo?')) return;

    this.groupService.deleteGroup(id)
      .then(() => this.loadGroups())
      .catch(err => console.error('Error al borrar el grupo:', err));
  }
}
