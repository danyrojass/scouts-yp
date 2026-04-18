import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {toSignal} from '@angular/core/rxjs-interop';
import {catchError, filter, map, of, switchMap} from 'rxjs';
import {GroupService} from '../../services/group.service';
import {Group} from '../../models';
import {NavigationService} from '../../../shared/services/navigation.service';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';

@Component({
    selector: 'app-group-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
    templateUrl: './group-form.component.html',
    styleUrls: [
        './group-form.component.css',
        './/../../../shared/styles/form-card.css',
    ]
})
export class GroupFormComponent {
    isLoading = signal(false);
    errorMessage = signal('');
    isEditing = signal(false);
    groupId = signal<string | null>(null);
    private fb = inject(FormBuilder);
    groupForm: FormGroup<{
        name: FormControl<string>;
        number: FormControl<string>;
        city: FormControl<string>;
    }> = this.fb.group({
        name: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
        number: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
        city: this.fb.control('', {nonNullable: true, validators: [Validators.required]})
    });
    private groupService = inject(GroupService);
    private router = inject(NavigationService);
    private route = inject(ActivatedRoute);
    group = toSignal(
        this.route.paramMap.pipe(
            map(params => params.get('id')),
            filter((id): id is string => id !== null),
            switchMap(id => {
                this.isEditing.set(true);
                this.groupId.set(id);
                this.isLoading.set(true);
                return this.groupService.getGroupById(id).pipe(
                    map(group => {
                        if (group) {
                            this.groupForm.patchValue(group);
                        }
                        this.isLoading.set(false);
                        return group;
                    }),
                    catchError(err => {
                        console.error('Error al cargar el grupo:', err);
                        this.errorMessage.set('Ocurrió un error al cargar el grupo');
                        this.isLoading.set(false);
                        return of(null);
                    })
                );
            })
        ),
        {initialValue: null}
    );

    async onSubmit() {
        if (this.groupForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const groupData: Group = {
            ...this.groupForm.getRawValue(),
            createdAt: new Date()
        };

        try {
            if (this.isEditing() && this.groupId()) {
                await this.groupService.updateGroup(this.groupId()!, groupData);
            } else {
                await this.groupService.createGroup(groupData);
            }
            this.router.navigate(['/groups']);
        } catch (error) {
            console.error(error);
            this.errorMessage.set(
                this.isEditing()
                    ? 'Ocurrió un error al editar el grupo'
                    : 'Ocurrió un error al crear el grupo'
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    onCancel(): void {
        this.router.navigate(['/groups']);
    }
}
