import {CommonModule} from '@angular/common';
import {Component, computed, inject, signal} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {map, of, switchMap} from 'rxjs';
import {GroupService} from '../../../groups/services/group.service';
import {SetService} from '../../../sets/services/set.service';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {User, UserLevel, UserType} from '../../models';
import {UserService} from '../../services/user.service';

@Component({
    selector: 'app-user-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, AlertComponent, LoadingSpinnerComponent],
    templateUrl: './user-form.component.html',
    styleUrls: ['./user-form.component.css']
})
export class UserFormComponent {

    isLoading = signal(false);
    errorMessage = signal('');
    isEditing = signal(false);
    userId = signal<string | null>(null);
    userTypes = Object.values(UserType);
    userLevels = Object.values(UserLevel);
    groupId = computed(() => this.userForm.get('groupId')?.value ?? '');
    private fb = inject(FormBuilder);
    userForm: FormGroup = this.fb.group({
        name: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        dateOfBirth: ['', [Validators.required]],
        type: [UserType.BENEFICIARIO, [Validators.required]],
        level: [UserLevel.LOBATO, [Validators.required]],
        groupId: [null],
        setId: [null]
    });
    private userService = inject(UserService);
    private groupService = inject(GroupService);
    groups = toSignal(this.groupService.getGroups(), {initialValue: []});
    private setService = inject(SetService);
    sets = toSignal(
        this.groupId().trim()
            ? this.setService.getSetsByGroup(this.groupId())
            : of([]),
        {initialValue: []}
    );
    private router = inject(NavigationService);
    private route = inject(ActivatedRoute);
    user = toSignal(
        this.route.paramMap.pipe(
            map(params => params.get('id')),
            switchMap(id => {
                if (!id) return of(null);
                this.isEditing.set(true);
                this.userId.set(id);
                this.isLoading.set(true);
                return this.userService.getUserById(id);
            })
        ),
        {initialValue: null}
    );

    constructor() {
        const currentUser = this.user();
        if (currentUser) {
            this.userForm.patchValue(currentUser);
            if (currentUser.groupId) {
                this.userForm.patchValue({groupId: currentUser.groupId});
            }
            this.isLoading.set(false);
        }
    }

    async onSubmit(): Promise<void> {
        if (this.userForm.invalid) return;

        this.isLoading.set(true);
        this.errorMessage.set('');

        const userData: Partial<User> = {
            ...this.userForm.getRawValue(),
            dateOfBirth: new Date(this.userForm.value.dateOfBirth)
        };

        try {
            if (this.isEditing() && this.userId()) {
                await this.userService.updateUser(this.userId()!, userData);
            } else {
                await this.userService.createUser(userData);
            }
            this.router.navigate(['/users']);
        } catch (error) {
            console.error(error);
            this.errorMessage.set(
                this.isEditing()
                    ? 'Ocurrió un error al editar el usuario'
                    : 'Ocurrió un error al crear el usuario'
            );
        } finally {
            this.isLoading.set(false);
        }
    }

    onCancel(): void {
        this.router.navigate(['/users']);
    }
}
