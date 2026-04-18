import {Component, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {SetService} from '../../services/set.service';
import {GroupService} from '../../../groups/services/group.service';
import {Set, SetType} from '../../models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {toSignal} from "@angular/core/rxjs-interop";
import {catchError, filter, map, of, switchMap} from "rxjs";

@Component({
    selector: 'app-set-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
    templateUrl: './set-form.component.html',
    styleUrls: [
        './set-form.component.css',
        '../../../shared/styles/form-card.css'
    ]
})
export class SetFormComponent {

    setTypes: string[] = Object.values(SetType);
    isLoading = signal(false);
    errorMessage = signal('');
    isEditing = signal(false);
    setId = signal<string | null>(null);
    private fb = inject(FormBuilder);
    setForm: FormGroup<{
        name: FormControl<string>;
        type: FormControl<SetType>;
        groupId: FormControl<string>;
    }> = this.fb.group({
        name: this.fb.control('', {nonNullable: true, validators: [Validators.required]}),
        type: this.fb.control(SetType.SEISENA, {nonNullable: true, validators: [Validators.required]}),
        groupId: this.fb.control('', {nonNullable: true, validators: [Validators.required]})
    });
    private setService = inject(SetService);
    private groupService = inject(GroupService);
    groups = toSignal(this.groupService.getGroups(), {initialValue: []});
    private router = inject(NavigationService);
    private route = inject(ActivatedRoute);
    set = toSignal(
        this.route.paramMap.pipe(
            map(params => params.get('id')),
            filter((id): id is string => id !== null),
            switchMap(id => {
                this.isEditing.set(true);
                this.setId.set(id);
                this.isLoading.set(true);
                return this.setService.getSetById(id).pipe(
                    map(activity => {
                        if (activity) {
                            this.setForm.patchValue(activity);
                        }
                        this.isLoading.set(false);
                        return activity;
                    }),
                    catchError(err => {
                        console.error('Error al cargar la sección:', err);
                        this.errorMessage.set('Ocurrió un error al cargar la sección');
                        this.isLoading.set(false);
                        return of(null);
                    })
                );
            })
        ),
        {initialValue: null}
    );

    async onSubmit(): Promise<void> {
        if (this.setForm.invalid) {
            this.errorMessage.set('Por favor completa todos los campos requeridos.');
            return;
        }

        this.isLoading.set(true);
        this.errorMessage.set('');

        const setData: Set = {
            ...this.setForm.getRawValue(),
            createdAt: new Date()
        };

        try {
            if (this.isEditing() && this.setId()) {
                await this.setService.updateSet(this.setId()!, setData);
            } else {
                await this.setService.createSet(setData);
            }

            this.router.navigate(['/sets']);
        } catch (error) {
            console.error(error);
            this.errorMessage.set(
                this.isEditing()
                    ? 'Ocurrió un error al editar la sección'
                    : 'Ocurrió un error al crear la sección'
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    onCancel(): void {
        this.router.navigate(['/sets']);
    }
}
