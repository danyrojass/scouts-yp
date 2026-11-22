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
import {dayDistanceLabel, featuredActivity as findFeaturedActivity, nextBirthday, progressPercent} from '../utils/dashboard-highlights.util';
import {branchNameForLevel, groupByLevel, unitNameForLevel, YOUTH_LEVELS} from '../../shared/utils/level.util';
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

interface CompletedSectionItem {
    setId: string;
    name: string;
    completedAt: Date;
    points: number;
}

interface CompletedActivityItem {
    level: UserLevel;
    name: string;
    activityId: string;
    completedAt: Date;
    sections: CompletedSectionItem[];
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
     * Actividad reciente agrupada por nivel. Cada actividad tiene una fila de
     * encabezado y una fila por sección con SUS puntos (nunca se suman entre
     * secciones).
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
                    sections: []
                };
                byActivity.set(activity.id, item);
            }

            if (new Date(completion.completedAt) > new Date(item.completedAt)) {
                item.completedAt = completion.completedAt;
            }

            const set = completion.setId ? setsById.get(completion.setId) : undefined;
            if (!set?.id) continue;

            // Varias completaciones de una misma sección (por integrante) se
            // consolidan en una sola fila; nunca se mezclan con otras secciones.
            let section = item.sections.find(s => s.setId === set.id);
            if (!section) {
                section = {setId: set.id, name: set.name, completedAt: completion.completedAt, points: 0};
                item.sections.push(section);
            }
            section.points += completion.earnedPoints;
            if (new Date(completion.completedAt) > new Date(section.completedAt)) {
                section.completedAt = completion.completedAt;
            }
        }

        for (const item of byActivity.values()) {
            item.sections.sort((a, b) => a.name.localeCompare(b.name));
        }

        const rows = [...byActivity.values()].sort(
            (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );

        return groupByLevel(rows);
    });

    showAllRecent = signal(false);
    recentActivityCount = computed(() =>
        this.groupedCompletedActivities().reduce((total, group) => total + group.items.length, 0)
    );

    isDirigente = computed(() => this.currentUser()?.type === UserType.DIRIGENTE);

    /** Actividades completadas por al menos una sección (no registros de completación). */
    completedActivitiesCount = computed(() => this.activityStats().completedCount);

    completionPercent = computed(() =>
        progressPercent(this.completedActivitiesCount(), this.activities().length)
    );

    featuredActivity = computed(() => findFeaturedActivity(this.activities()));

    /** Cumpleaños de los próximos 60 días, como máximo 5. */
    upcomingBirthdays = computed(() => {
        const birthdays: {user: User; date: Date; days: number}[] = [];
        for (const user of this.groupUsers()) {
            const birthday = nextBirthday(user.dateOfBirth);
            if (birthday && birthday.days <= 60) {
                birthdays.push({user, date: birthday.date, days: birthday.days});
            }
        }
        return birthdays.sort((a, b) => a.days - b.days).slice(0, 5);
    });

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
     * Tabla de posiciones separada por rama (Manada, Tropa, Comunidad, Clan)
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
    protected readonly branchNameForLevel = branchNameForLevel;
    protected readonly dayDistanceLabel = dayDistanceLabel;

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

            // Modo grupo único: si un usuario histórico no tiene group_id,
            // se muestra igual el tablero (la BD sólo contiene este grupo).
            const groupId = user.groupId;

            const [group, users, allSets, allActivities] = await Promise.all([
                groupId
                    ? firstValueFrom(this.groupService.getGroupById(groupId))
                    : Promise.resolve(null),
                groupId
                    ? firstValueFrom(this.userService.getUsersByGroup(groupId))
                    : firstValueFrom(this.userService.getUsers()),
                firstValueFrom(this.setService.getSets()),
                firstValueFrom(this.activityService.getActivities())
            ]);

            const isDirigente = user.type === UserType.DIRIGENTE;
            let filteredSets = groupId ? allSets.filter(s => s.groupId === groupId) : allSets;
            let filteredActivities = allActivities;
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
