import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {filter, take} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';

import {AuthService} from '../../auth/services/auth.service';
import {GroupService} from '../../groups/services/group.service';
import {UserService} from '../../users/services/user.service';
import {SetService} from '../../sets/services/set.service';
import {ActivityService} from '../../activities/services/activity.service';

import {User, UserLevel, UserType} from '../../users/models';
import {Group} from '../../groups/models';
import {Set} from '../../sets/models';
import {Activity, ActivityCompletion} from '../../activities/models';
import {computeActivityStats} from '../../activities/utils/completion-stats.util';
import {groupByLevel, unitNameForLevel, YOUTH_LEVELS} from '../../shared/utils/level.util';
import {LoadingSpinnerComponent} from "../../shared/components";
import {RouterLink} from "@angular/router";
import {DatePipe} from "@angular/common";

interface DashboardData {
    group: Group | undefined;
    users: User[];
    sets: Set[];
    activities: Activity[];
    completions: ActivityCompletion[];
    userSet?: Set;
}

interface GroupedSets {
    level: UserLevel;
    unitName: string | null;
    sets: Set[];
}

interface LeaderboardEntry {
    set: Set;
    totalPoints: number;
    completedCount: number;
    totalActivities: number;
}

interface CompletedActivityItem {
    level: UserLevel;
    name: string;
    activityId: string;
    completedAt: Date;
    earnedPoints: number;
    sections: string[];
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        LoadingSpinnerComponent,
        RouterLink,
        DatePipe
    ],
    templateUrl: './dashboard.component.html',
    styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

    currentUser = signal<User | null>(null);
    userGroup = signal<Group | null>(null);
    userSet = signal<Set | null>(null);
    groupUsers = signal<User[]>([]);
    groupSets = signal<Set[]>([]);
    activities = signal<Activity[]>([]);
    completedActivities = signal<ActivityCompletion[]>([]);

    groupedSets = computed(() => {
        const sets = this.groupSets();
        const grouped: GroupedSets[] = [];

        for (const level of YOUTH_LEVELS) {
            const setsOfLevel = sets.filter(s => s.level === level);
            if (setsOfLevel.length > 0) {
                grouped.push({ level, unitName: unitNameForLevel(level), sets: setsOfLevel });
            }
        }

        return grouped;
    });

    /** Contadores de actividades completadas, sin multiplicar por integrantes. */
    activityStats = computed(() => computeActivityStats(
        this.activities(),
        this.groupSets(),
        this.groupUsers(),
        this.completedActivities()
    ));

    /**
     * Actividad reciente agrupada por nivel, con una fila por actividad (no por
     * completación) y las secciones que la completaron.
     */
    groupedCompletedActivities = computed(() => {
        const stats = this.activityStats();
        const setsById = new Map(this.groupSets().map(s => [s.id!, s]));
        const byActivity = new Map<string, CompletedActivityItem>();

        for (const completion of this.completedActivities()) {
            const activity = stats.activitiesById.get(completion.activityId);
            if (!activity?.id) continue;

            let item = byActivity.get(activity.id);
            if (!item) {
                item = {
                    level: activity.level,
                    name: activity.name,
                    activityId: activity.id,
                    completedAt: completion.completedAt,
                    earnedPoints: 0,
                    sections: []
                };
                byActivity.set(activity.id, item);
            }

            item.earnedPoints += completion.earnedPoints;
            if (new Date(completion.completedAt) > new Date(item.completedAt)) {
                item.completedAt = completion.completedAt;
            }

            const set = completion.setId ? setsById.get(completion.setId) : undefined;
            if (set && !item.sections.includes(set.name)) {
                item.sections.push(set.name);
            }
        }

        const rows = [...byActivity.values()].sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );

        return groupByLevel(rows);
    });

    isDirigente = computed(() => this.currentUser()?.type === UserType.DIRIGENTE);

    /**
     * Dirigente: puntos de todas las secciones del grupo.
     * Beneficiario: puntos de su propia sección.
     */
    totalPoints = computed(() => {
        const user = this.currentUser();
        if (!user) return 0;

        const completions = this.completedActivities();

        if (user.type === UserType.DIRIGENTE) {
            return completions.reduce((sum, c) => sum + c.earnedPoints, 0);
        }

        if (!user.setId) return 0;

        return completions
            .filter(c => c.setId === user.setId)
            .reduce((sum, c) => sum + c.earnedPoints, 0);
    });

    pointsLabel = computed(() =>
        this.isDirigente() ? 'Puntos del grupo' : 'Puntos de mi sección'
    );

    /** Actividades completadas por al menos una sección (no registros de completación). */
    completedActivitiesCount = computed(() => this.activityStats().completedCount);

    leaderboard = computed(() => {
        const stats = this.activityStats();
        const completions = this.completedActivities();
        const entries: LeaderboardEntry[] = [];

        for (const set of this.groupSets()) {
            if (!set.id) continue;
            const setStats = stats.bySet.get(set.id);
            if (setStats && setStats.completedCount > 0) {
                entries.push({
                    set,
                    totalPoints: completions
                        .filter(c => c.setId === set.id)
                        .reduce((sum, c) => sum + c.earnedPoints, 0),
                    completedCount: setStats.completedCount,
                    totalActivities: setStats.totalActivities
                });
            }
        }

        entries.sort((a, b) => b.totalPoints - a.totalPoints);
        return entries;
    });

    /**
     * Tabla de posiciones separada por rama (Seisena, Patrulla, Equipo, Clan)
     * para poder comparar contra pares del mismo tipo.
     */
    groupedLeaderboard = computed(() =>
        this.groupSets().length === 0
            ? []
            : YOUTH_LEVELS
                .map(level => ({
                    level,
                    unitName: unitNameForLevel(level),
                    entries: this.leaderboard().filter(entry => entry.set.level === level),
                }))
                .filter(group => group.entries.length > 0)
    );

    isLoading = computed(() => this.currentUser() === null);

    protected readonly UserType = UserType;
    protected readonly unitNameForLevel = unitNameForLevel;

    private authService = inject(AuthService);
    private groupService = inject(GroupService);
    private userService = inject(UserService);
    private setService = inject(SetService);
    private activityService = inject(ActivityService);

    async ngOnInit(): Promise<void> {
        try {
            const user = await firstValueFrom(
                this.authService.user$.pipe(
                    filter((u): u is User => u !== null),
                    take(1)
                )
            );

            this.currentUser.set(user);

            if (!user.groupId) {
                return;
            }

            const [group, users, allSets, allActivities] = await Promise.all([
                firstValueFrom(this.groupService.getGroupById(user.groupId!)),
                firstValueFrom(this.userService.getUsersByGroup(user.groupId!)),
                firstValueFrom(this.setService.getSets()),
                firstValueFrom(this.activityService.getActivities())
            ]);

            const isDirigente = user.type === UserType.DIRIGENTE;
            let filteredSets = allSets;
            let filteredActivities = allActivities;

            filteredSets = filteredSets.filter(s => s.groupId === user.groupId);
            if (!isDirigente) {
                if (user.setId) {
                    const userSet = filteredSets.find(s => s.id === user.setId);
                    if (userSet) {
                        filteredSets = filteredSets.filter(s => s.level === userSet.level);
                    }
                }
                filteredActivities = filteredActivities.filter(a => a.level === user.level);
            }

            const setIds = filteredSets.map(s => s.id!).filter(Boolean);
            const completions = setIds.length > 0
                ? await firstValueFrom(this.activityService.getCompletionsBySetIds(setIds))
                : [];

            const results: DashboardData = {
                group: group ?? undefined,
                users,
                sets: filteredSets,
                activities: filteredActivities,
                completions,
                userSet: undefined
            };

            if (user.setId) {
                results.userSet = await firstValueFrom(this.setService.getSetById(user.setId)) ?? undefined;
            }

            this.userGroup.set(results.group ?? null);
            this.groupUsers.set(results.users);
            this.groupSets.set(results.sets);
            this.activities.set(results.activities);
            this.completedActivities.set(results.completions);
            if (results.userSet) {
                this.userSet.set(results.userSet);
            }
        } catch (err) {
            console.error('Error loading dashboard data:', err);
        }
    }
}
