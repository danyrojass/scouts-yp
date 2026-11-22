import {CommonModule} from '@angular/common';
import {Component, computed, effect, inject, signal} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute} from '@angular/router';
import {map, of, startWith, switchMap} from 'rxjs';
import {GroupService} from '../../../groups/services/group.service';
import {SetService} from '../../../sets/services/set.service';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {AuthService} from '../../../auth/services/auth.service';
import {User, UserLevel, UserType} from '../../models';
import {UserService} from '../../services/user.service';
import {unitNameForLevel} from '../../../shared/utils/level.util';

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
    protected readonly UserType = UserType;
    protected readonly unitNameForLevel = unitNameForLevel;
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
    private authService = inject(AuthService);
    groups = toSignal(this.groupService.getGroups(), {initialValue: []});
    private setService = inject(SetService);
    // Modo grupo único: las secciones siempre son las del grupo del dirigente.
    private currentGroupId = computed(() => this.authService.user()?.groupId ?? '');
    sets = toSignal(
        toObservable(this.currentGroupId).pipe(
            switchMap(groupId => groupId
                ? this.setService.getSetsByGroup(groupId)
                : of([])
            )
        ),
        {initialValue: []}
    );
    private typeValue = toSignal(
        this.userForm.get('type')!.valueChanges.pipe(startWith(this.userForm.get('type')!.value)),
        {initialValue: UserType.BENEFICIARIO as UserType}
    );
    private levelValue = toSignal(
        this.userForm.get('level')!.valueChanges.pipe(startWith(this.userForm.get('level')!.value)),
        {initialValue: UserLevel.LOBATO as UserLevel}
    );

    /** Un dirigente no tiene sección; un beneficiario solo ve secciones de su nivel. */
    availableSets = computed(() => {
        if (this.typeValue() === UserType.DIRIGENTE) return [];
        return this.sets().filter(s => s.level === this.levelValue());
    });
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
        // El grupo nunca se elige: se hereda del dirigente autenticado.
        effect(() => {
            const groupId = this.currentGroupId();
            if (groupId) this.userForm.patchValue({groupId}, {emitEvent: false});
        });

        const currentUser = this.user();
        if (currentUser) {
            this.userForm.patchValue(currentUser);
            if (currentUser.groupId) {
                this.userForm.patchValue({groupId: currentUser.groupId});
            }
            this.isLoading.set(false);
        }

        // Un dirigente no pertenece a una sección.
        this.userForm.get('type')!.valueChanges.subscribe((type: UserType) => {
            if (type === UserType.DIRIGENTE) {
                this.userForm.patchValue(
                    {level: UserLevel.JEFE, setId: null},
                    {emitEvent: false}
                );
            } else if (this.userForm.get('level')!.value === UserLevel.JEFE) {
                this.userForm.patchValue(
                    {level: UserLevel.LOBATO, setId: null},
                    {emitEvent: false}
                );
            }
        });

        // Al cambiar de nivel se limpia la sección si ya no corresponde.
        this.userForm.get('level')!.valueChanges.subscribe(() => {
            const setId = this.userForm.get('setId')!.value;
            if (setId && !this.availableSets().some(s => s.id === setId)) {
                this.userForm.patchValue({setId: null}, {emitEvent: false});
            }
        });

        // La sección es la fuente de verdad del nivel.
        this.userForm.get('setId')!.valueChanges.subscribe((setId: string | null) => {
            const set = this.availableSets().find(s => s.id === setId);
            if (set) {
                this.userForm.patchValue({level: set.level}, {emitEvent: false});
            }
        });
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
