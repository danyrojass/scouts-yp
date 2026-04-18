import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {GroupService} from '../../services/group.service';
import {Group} from '../../models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-group-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
  templateUrl: './group-form.component.html',
  styleUrls: ['./group-form.component.css']
})
export class GroupFormComponent {
  private fb = inject(FormBuilder);
  private groupService = inject(GroupService);
  private router = inject(NavigationService);
  private route = inject(ActivatedRoute);

  groupForm = this.fb.group({
    name: this.fb.nonNullable.control('', Validators.required),
    number: this.fb.nonNullable.control('', Validators.required),
    city: this.fb.nonNullable.control('', Validators.required)
  });

  groupId: string | null = null;
  isLoading = signal(false);
  isEditing = signal(false);
  errorMessage = signal('');

  constructor() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditing.set(true);
        this.groupId = id;
        this.loadGroup(id);
      }
    });
  }

  loadGroup(id: string | null): void {
    this.isLoading.set(true);
    this.groupService.getGroupById(id).subscribe({
      next: (group): void => {
        this.groupForm.patchValue(group);
        this.isLoading.set(false);
      },
      error: (error): void => {
        console.error('Error al cargar el grupo:', error);
        this.errorMessage.set('Ocurrió un error al cargar el grupo');
        this.isLoading.set(false);
      }
    });
  }

  async onSubmit() {
    if (this.groupForm.invalid) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const groupData: Group = {
      ...this.groupForm.getRawValue(),
      createdAt: new Date()
    };

    try {
      if (this.isEditing() && this.groupId) {
        await this.groupService.updateGroup(this.groupId, groupData);
      } else {
        await this.groupService.createGroup(groupData);
      }
      this.router.navigate(['/groups']);
    } catch (error) {
      console.error(error);
      this.errorMessage.set(this.isEditing()
        ? 'Ocurrió un error al editar el grupo'
        : 'Ocurrió un error al crear el grupo');
    } finally {
      this.isLoading.set(false);
    }
  }


  onCancel(): void {
    this.router.navigate(['/groups']);
  }
}
