import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {UserService} from '../../services/user.service';
import {GroupService} from '../../../groups/services/group.service';
import {SetService} from '../../../sets/services/set.service';
import {User, UserLevel, UserType} from '../../models';
import {Group} from '../../../groups/models';
import {Set} from '../../../sets/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css']
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  isLoading: boolean = false;
  isEditing: boolean = false;
  userId: string | null = null;
  errorMessage: string = '';
  groups: Group[] = [];
  sets: Set[] = [];

  userTypes: string[] = Object.values(UserType);
  userLevels: string[] = Object.values(UserLevel);

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private groupService: GroupService,
    private setService: SetService,
    private router: NavigationService,
    private route: ActivatedRoute
  ) {
  }

  ngOnInit(): void {
    this.initForm();
    this.loadGroups();

    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditing = true;
        this.userId = params['id'];
        this.loadUser(this.userId);
      }
    });

    const groupIdControl = this.userForm.get('groupId');
    if (groupIdControl) {
      groupIdControl.valueChanges.subscribe((groupId: string | null) => {
        if (groupId) {
          this.loadSets(groupId);
        } else {
          this.sets = [];
          this.userForm.patchValue({setId: null});
        }
      });
    }
  }

  initForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      dateOfBirth: ['', [Validators.required]],
      type: [UserType.BENEFICIARIO, [Validators.required]],
      level: [UserLevel.LOBATO, [Validators.required]],
      groupId: [null],
      setId: [null]
    });
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe(groups => {
      this.groups = groups;
    });
  }

  loadSets(groupId: string): void {
    this.setService.getSetsByGroup(groupId).subscribe(sets => {
      this.sets = sets;
    });
  }

  loadUser(id: string | null): void {
    this.isLoading = true;
    this.userService.getUserById(id).subscribe({
      next: (user): void => {
        this.userForm.patchValue(user);
        if (user.groupId) {
          this.loadSets(user.groupId);
        }
        this.isLoading = false;
      },
      error: (error): void => {
        console.error('Error al cargar el usuario:', error);
        this.errorMessage = 'Ocurrió un error al cargar el usuario';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const userData: Partial<User> = {
      ...this.userForm.value,
      dateOfBirth: new Date(this.userForm.value.dateOfBirth)
    };

    if (this.isEditing && this.userId) {
      this.userService.updateUser(this.userId, userData).subscribe({
        next: () => {
          this.router.navigate(['/users']);
        },
        error: (error) => {
          console.error('Error al editar el usuario:', error);
          this.errorMessage = 'Ocurrió un error al editar el usuario';
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/users']);
  }
}
