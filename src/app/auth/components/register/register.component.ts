import {Component, computed, effect, inject, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {GroupService} from '../../../groups/services/group.service';
import {AlertComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {UserLevel, UserType} from '../../../users/models';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, AlertComponent],
    templateUrl: './register.component.html',
    styleUrls: ['./register.component.css']
})
export class RegisterComponent {
    isLoading = signal(false);
    errorMessage = signal('');
    groups = signal<any[]>([]);
    userLevels = signal(Object.values(UserLevel));
    userTypes = signal(Object.values(UserType));
    createNewGroup = computed(
        () => this.registerForm.get('groupId')?.value === 'new'
    );
    private fb = inject(FormBuilder);
    registerForm = this.fb.group({
        name: this.fb.nonNullable.control('', {validators: [Validators.required]}),
        email: this.fb.nonNullable.control('', {validators: [Validators.required, Validators.email]}),
        password: this.fb.nonNullable.control('', {validators: [Validators.required, Validators.minLength(6)]}),
        dateOfBirth: this.fb.control('', {validators: [Validators.required]}),
        type: this.fb.nonNullable.control(UserType.BENEFICIARIO, {validators: [Validators.required]}),
        level: this.fb.nonNullable.control(UserLevel.LOBATO, {validators: [Validators.required]}),
        groupId: this.fb.control<string>(''),
        newGroup: this.fb.group({
            name: this.fb.nonNullable.control(''),
            number: this.fb.nonNullable.control(''),
            city: this.fb.nonNullable.control(''),
        })
    });
    private authService = inject(AuthService);
    private groupService = inject(GroupService);
    private router = inject(NavigationService);

    constructor() {
        this.loadGroups();

        effect(() => {
            const isNew = this.createNewGroup();
            const newGroup = this.registerForm.get('newGroup');

            if (!newGroup) return;

            if (isNew) {
                newGroup.get('name')?.addValidators(Validators.required);
                newGroup.get('number')?.addValidators(Validators.required);
                newGroup.get('city')?.addValidators(Validators.required);
            } else {
                newGroup.get('name')?.removeValidators(Validators.required);
                newGroup.get('number')?.removeValidators(Validators.required);
                newGroup.get('city')?.removeValidators(Validators.required);
            }

            newGroup.get('name')?.updateValueAndValidity();
            newGroup.get('number')?.updateValueAndValidity();
            newGroup.get('city')?.updateValueAndValidity();
        });
    }

    onSubmit(): void {
        if (this.registerForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const {email, password, name, dateOfBirth, type, level, groupId, newGroup} = this.registerForm.getRawValue();

        const userData: any = {
            name,
            type,
            level
        };

        if (dateOfBirth) {
            userData.dateOfBirth = new Date(dateOfBirth);
        }

        if (this.createNewGroup()) {

            if (!newGroup?.name || !newGroup?.number || !newGroup?.city) {
                this.isLoading.set(false);
                this.errorMessage.set('Debe completar todos los datos del grupo.');
                return;
            }

            // Crear grupo primero
            this.groupService.createGroup({
                name: newGroup.name,
                number: newGroup.number,
                city: newGroup.city,
                createdAt: new Date()
            }).then(groupRef => {
                userData.groupId = groupRef.id;
                this.registerUser(email!, password!, userData);
            }).catch(error => {
                console.error('Error al crear el grupo:', error);
                this.isLoading.set(false);
                this.errorMessage.set(
                    error.message || 'Ocurrió un error al crear el grupo.'
                );
            });
        } else if (groupId) {
            userData.groupId = groupId;
            this.registerUser(email!, password!, userData);
        } else {
            this.registerUser(email!, password!, userData);
        }
    }

    dismissError(): void {
        this.errorMessage.set('');
    }

    private loadGroups(): void {
        this.groupService.getGroups().subscribe({
            next: groups => this.groups.set(groups),
            error: err => {
                console.error('Error cargando grupos:', err);
                this.errorMessage.set('No se pudieron cargar los grupos.');
            }
        });
    }

    private registerUser(email: string, password: string, userData: any): void {
        this.authService.register(email, password, userData).subscribe({
            next: () => {
                this.isLoading.set(false);
                this.router.navigate(['/dashboard']);
            },
            error: (error) => {
                console.error('Error al registrar:', error);
                this.isLoading.set(false);
                this.errorMessage.set(error.message || 'Ocurrió un error en el registro.');
            }
        });
    }
}
