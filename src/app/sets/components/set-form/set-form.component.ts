import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {SetService} from '../../services/set.service';
import {GroupService} from '../../../groups/services/group.service';
import {Set, SetType} from '../../models';
import {Group} from '../../../groups/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';

@Component({
  selector: 'app-set-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
  templateUrl: './set-form.component.html',
  styleUrls: ['./set-form.component.css']
})
export class SetFormComponent implements OnInit {
  setForm!: FormGroup;
  isLoading: boolean = false;
  isEditing: boolean = false;
  setId: string | null = null;
  errorMessage: string = '';
  groups: Group[] = [];

  setTypes: string[] = Object.values(SetType);

  constructor(
    private fb: FormBuilder,
    private setService: SetService,
    private groupService: GroupService,
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
        this.setId = params['id'];
        this.loadSet(this.setId);
      }
    });
  }

  initForm(): void {
    this.setForm = this.fb.group({
      name: ['', [Validators.required]],
      type: [SetType.SEISENA, [Validators.required]],
      groupId: ['', [Validators.required]]
    });
  }

  loadGroups(): void {
    this.groupService.getGroups().subscribe(groups => {
      this.groups = groups;
    });
  }

  loadSet(id: string | null): void {
    this.isLoading = true;
    this.setService.getSetById(id).subscribe({
      next: (set: Set): void => {
        this.setForm.patchValue(set);
        this.isLoading = false;
      },
      error: (error): void => {
        console.error('Error al cargar la sección:', error);
        this.errorMessage = 'Ocurrió un error al cargar la sección';
        this.isLoading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.setForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const setData: Set = {
      ...this.setForm.value,
      createdAt: new Date()
    };

    if (this.isEditing && this.setId) {
      this.setService.updateSet(this.setId, setData).subscribe({
        next: () => {
          this.router.navigate(['/sets']);
        },
        error: (error) => {
          console.error('Error al editar la sección:', error);
          this.errorMessage = 'Ocurrió un error al editar la sección';
          this.isLoading = false;
        }
      });
    } else {
      this.setService.createSet(setData).subscribe({
        next: () => {
          this.router.navigate(['/sets']);
        },
        error: (error) => {
          console.error('Error al crear la sección:', error);
          this.errorMessage = 'Ocurrió un error al crear la sección';
          this.isLoading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/sets']);
  }
}
