import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ActivatedRoute} from '@angular/router';
import {filter, firstValueFrom, take} from 'rxjs';

import {AuthService} from '../../../auth/services/auth.service';
import {ActivityService, CompletionUpdate} from '../../services/activity.service';
import {Activity, ActivityCompletion} from '../../models';
import {User, UserType} from '../../../users/models';
import {UserService} from '../../../users/services/user.service';
import {SetService} from '../../../sets/services/set.service';
import {Set} from '../../../sets/models';
import {AlertComponent, LoadingSpinnerComponent} from '../../../shared/components';
import {NavigationService} from '../../../shared/services/navigation.service';
import {branchNameForLevel, getSetsForLevel, unitNameForLevel} from '../../../shared/utils/level.util';

interface MemberRow {
    user: User;
    selected: boolean;
    points: number;
    existing?: ActivityCompletion;
}

@Component({
    selector: 'app-activity-complete',
    standalone: true,
    imports: [CommonModule, AlertComponent, LoadingSpinnerComponent],
    templateUrl: './activity-complete.component.html',
    styleUrls: [
        './activity-complete.component.css',
        '../../../shared/styles/form-card.css'
    ]
})
export class ActivityCompleteComponent implements OnInit {
    isLoading = signal(true);
    loadingMembers = signal(false);
    saving = signal(false);
    errorMessage = signal('');
    successMessage = signal('');
    currentUser = signal<User | null>(null);
    allUserSets = signal<Set[]>([]);
    groupUsers = signal<User[]>([]);
    activities = signal<Activity[]>([]);
    completions = signal<ActivityCompletion[]>([]);
    availableSets = signal<Set[]>([]);
    selectedActivityId = signal('');
    selectedSetId = signal('');
    completedAt = signal(this.today());
    memberRows = signal<MemberRow[]>([]);

    selectedActivity = computed(() =>
        this.activities().find(a => a.id === this.selectedActivityId()) ?? null
    );
    selectedSet = computed(() =>
        this.availableSets().find(s => s.id === this.selectedSetId()) ?? null
    );
    maxPoints = computed(() => this.selectedActivity()?.points ?? 0);
    canEditOthers = computed(() => this.currentUser()?.type === UserType.DIRIGENTE);
    selectedCount = computed(() => this.memberRows().filter(row => row.selected).length);
    selectedPointsTotal = computed(() =>
        this.memberRows().reduce((sum, row) => sum + (row.selected ? row.points : 0), 0)
    );
    allSelected = computed(() =>
        this.memberRows().length > 0 && this.memberRows().every(row => row.selected)
    );
    /** Alta, baja o cambio de puntos: cualquier cambio habilita Guardar. */
    hasChanges = computed(() => this.memberRows().some(row =>
        (row.selected && !row.existing) ||
        (!row.selected && !!row.existing) ||
        (row.selected && !!row.existing && row.points !== row.existing.earnedPoints)
    ));

    protected readonly unitNameForLevel = unitNameForLevel;
    protected readonly branchNameForLevel = branchNameForLevel;

    private authService = inject(AuthService);
    private activityService = inject(ActivityService);
    private userService = inject(UserService);
    private setService = inject(SetService);
    private navigationService = inject(NavigationService);
    private route = inject(ActivatedRoute);

    async ngOnInit(): Promise<void> {
        try {
            const user = await firstValueFrom(
                this.authService.user$.pipe(
                    filter((u): u is User => u !== null),
                    take(1)
                )
            );
            this.currentUser.set(user);

            const [sets, users, activities] = await Promise.all([
                user.groupId
                    ? firstValueFrom(this.setService.getSetsByGroup(user.groupId))
                    : Promise.resolve([] as Set[]),
                user.groupId
                    ? firstValueFrom(this.userService.getUsersByGroup(user.groupId))
                    : Promise.resolve([] as User[]),
                user.type === UserType.DIRIGENTE
                    ? firstValueFrom(this.activityService.getActivities())
                    : firstValueFrom(this.activityService.getActivitiesByLevel(user.level))
            ]);

            this.allUserSets.set(sets);
            this.groupUsers.set(users);
            this.activities.set(activities);

            if (user.setId) this.selectedSetId.set(user.setId);

            const presetId = this.route.snapshot.queryParamMap.get('activityId');
            if (presetId && activities.some(a => a.id === presetId)) {
                await this.selectActivity(presetId);
            }
        } catch (err) {
            console.error('Error al cargar los datos de completación:', err);
            this.errorMessage.set('No se pudieron cargar los datos');
        } finally {
            this.isLoading.set(false);
        }
    }

    async selectActivity(id: string): Promise<void> {
        this.selectedActivityId.set(id);
        this.successMessage.set('');
        this.errorMessage.set('');

        const activity = this.activities().find(a => a.id === id);
        const user = this.currentUser();
        let candidates = activity ? getSetsForLevel(this.allUserSets(), activity.level) : [];

        if (!this.canEditOthers() && user?.setId) {
            candidates = candidates.filter(set => set.id === user.setId);
        }

        this.availableSets.set(candidates);
        if (!candidates.some(set => set.id === this.selectedSetId())) {
            this.selectedSetId.set(candidates[0]?.id ?? '');
        }

        await this.loadCompletions();
    }

    onActivityChange(event: Event): void {
        void this.selectActivity((event.target as HTMLSelectElement).value);
    }

    selectSet(id: string): void {
        this.selectedSetId.set(id);
        this.rebuildRows();
    }

    onToggle(index: number, checked: boolean): void {
        this.memberRows.update(rows =>
            rows.map((row, i) => i === index ? {...row, selected: checked} : row)
        );
    }

    toggleAll(): void {
        const select = !this.allSelected();
        this.memberRows.update(rows => rows.map(row => ({...row, selected: select})));
    }

    onPointsInput(index: number, event: Event): void {
        const raw = parseInt((event.target as HTMLInputElement).value, 10);
        const max = this.maxPoints();
        const points = Math.min(max, Math.max(0, isNaN(raw) ? 0 : raw));

        this.memberRows.update(rows =>
            rows.map((row, i) => i === index ? {...row, points} : row)
        );
    }

    async onSave(): Promise<void> {
        const activity = this.selectedActivity();
        const setId = this.selectedSetId();
        if (!activity?.id || !setId) return;

        const dateValue = this.completedAt();
        const completedAt = dateValue ? new Date(`${dateValue}T12:00:00`) : new Date();
        const toCreate: ActivityCompletion[] = [];
        const toDelete: string[] = [];
        const toUpdate: CompletionUpdate[] = [];

        for (const row of this.memberRows()) {
            if (!row.user.id) continue;

            if (row.selected && !row.existing) {
                toCreate.push({
                    activityId: activity.id,
                    setId,
                    userId: row.user.id,
                    completedAt,
                    earnedPoints: row.points
                });
            } else if (row.selected && row.existing?.id && row.points !== row.existing.earnedPoints) {
                toUpdate.push({
                    id: row.existing.id,
                    earnedPoints: row.points,
                    completedAt
                });
            } else if (!row.selected && row.existing?.id && row.existing.userId === row.user.id) {
                // Sólo se quitan completaciones propias del miembro. Las históricas
                // (atribuidas a un dirigente) no aparecen en esta lista.
                toDelete.push(row.existing.id);
            }
        }

        if (toCreate.length === 0 && toDelete.length === 0 && toUpdate.length === 0) {
            this.successMessage.set('No hay cambios para guardar');
            return;
        }

        this.saving.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        try {
            await this.activityService.saveCompletions(toCreate, toDelete, toUpdate);
            const changes: string[] = [];
            if (toCreate.length) changes.push(`${toCreate.length} guardadas`);
            if (toUpdate.length) changes.push(`${toUpdate.length} actualizadas`);
            if (toDelete.length) changes.push(`${toDelete.length} quitadas`);
            this.successMessage.set(`${changes.join(', ')} correctamente`);
            await this.loadCompletions();
        } catch (err) {
            console.error('Error al guardar completaciones:', err);
            this.errorMessage.set('Ocurrió un error al guardar las completaciones');
        } finally {
            this.saving.set(false);
        }
    }

    onCancel(): void {
        this.navigationService.navigate(['/dashboard']);
    }

    private async loadCompletions(): Promise<void> {
        const activityId = this.selectedActivityId();
        this.memberRows.set([]);
        if (!activityId) return;

        this.loadingMembers.set(true);
        try {
            const data = await this.activityService.getActivityCompletionsByActivityId(activityId);
            this.completions.set(data);
            this.rebuildRows();
        } catch (err) {
            console.error('Error al cargar completaciones:', err);
            this.errorMessage.set('No se pudieron cargar las completaciones');
        } finally {
            this.loadingMembers.set(false);
        }
    }

    private rebuildRows(): void {
        const activityId = this.selectedActivityId();
        const setId = this.selectedSetId();
        if (!activityId || !setId) {
            this.memberRows.set([]);
            return;
        }

        const user = this.currentUser();
        const members = this.canEditOthers()
            ? this.groupUsers().filter(member => member.setId === setId)
            : this.groupUsers().filter(member =>
                !!user && member.id === user.id && member.setId === setId
            );

        const own = new Map(
            this.completions()
                .filter(c => c.activityId === activityId && c.setId === setId)
                .map(c => [c.userId, c] as const)
        );
        const max = this.maxPoints();

        this.memberRows.set(members.map(member => {
            const existing = member.id ? own.get(member.id) : undefined;
            return {
                user: member,
                selected: !!existing,
                points: existing?.earnedPoints ?? max,
                existing
            };
        }));
    }

    private today(): string {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
        return local.toISOString().split('T')[0];
    }
}
