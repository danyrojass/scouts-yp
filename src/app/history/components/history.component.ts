import {Component, inject, OnInit, signal} from '@angular/core';
import {RouterLink} from '@angular/router';
import {firstValueFrom} from 'rxjs';
import {filter, take} from 'rxjs/operators';

import {AuthService} from '../../auth/services/auth.service';
import {ActivityService} from '../../activities/services/activity.service';
import {GroupService} from '../../groups/services/group.service';
import {MembershipService} from '../../memberships/services/membership.service';
import {SetService} from '../../sets/services/set.service';
import {UserService} from '../../users/services/user.service';
import {Activity, ActivityCompletion} from '../../activities/models';
import {Set} from '../../sets/models';
import {User, UserType} from '../../users/models';
import {computeActivityStats} from '../../activities/utils/completion-stats.util';
import {branchNameForLevel, unitNameForLevel} from '../../shared/utils/level.util';
import {usersForYear, yearFor} from '../../shared/utils/year.util';
import {LoadingSpinnerComponent} from '../../shared/components/loading-spinner/loading-spinner.component';

interface YearHistory {
    year: number;
    activities: Activity[];
    completions: ActivityCompletion[];
    members: User[];
    totalPoints: number;
    completedCount: number;
    executiveCount: number;
    activeSets: number;
    topSets: {name: string; branch: string | null; points: number}[];
}

@Component({
    selector: 'app-history',
    standalone: true,
    imports: [RouterLink, LoadingSpinnerComponent],
    templateUrl: './history.component.html',
    styleUrl: './history.component.css'
})
export class HistoryComponent implements OnInit {
    private authService = inject(AuthService);
    private groupService = inject(GroupService);
    private userService = inject(UserService);
    private setService = inject(SetService);
    private activityService = inject(ActivityService);
    private membershipService = inject(MembershipService);

    isLoading = signal(true);
    years = signal<number[]>([]);
    history = signal<YearHistory[]>([]);
    selectedYear = signal<number | null>(null);
    expandedYear = signal<number | null>(null);
    readonly UserType = UserType;

    async ngOnInit(): Promise<void> {
        try {
            const user = await firstValueFrom(
                this.authService.user$.pipe(
                    filter((u): u is User => u !== null),
                    take(1)
                )
            );
            const groupId = user?.groupId ?? null;
            const group = groupId ? await firstValueFrom(this.groupService.getGroupById(groupId)) : undefined;
            const availableYears = (group?.years?.length ? group.years : [yearFor(group?.activeYear)])
                .map(yearFor)
                .sort((a: number, b: number) => b - a);
            const sets = await firstValueFrom(this.setService.getSets());
            const groupSets = groupId ? sets.filter(s => s.groupId === groupId) : sets;
            const users = groupId
                ? await firstValueFrom(this.userService.getUsersByGroup(groupId))
                : await firstValueFrom(this.userService.getUsers());

            const allMemberships = await firstValueFrom(this.membershipService.getAllMemberships(groupId ?? undefined));
            const byYear = new Map<number, any[]>();
            allMemberships.forEach(m => {
                const list = byYear.get(m.year) ?? [];
                list.push(m);
                byYear.set(m.year, list);
            });
            // Si aún no hay memberships, mostramos el año por defecto con los datos actuales.
            if (byYear.size === 0) byYear.set(yearFor(), []);

            const result: YearHistory[] = [];
            for (const year of availableYears) {
                const memberships = byYear.get(year) ?? [];
                const [activities, completions] = await Promise.all([
                    firstValueFrom(this.activityService.getActivities(year)),
                    firstValueFrom(this.activityService.getCompletionsBySetIds(
                        groupSets.map(s => s.id!).filter(Boolean), year
                    ))
                ]);
                const allYearUsers = usersForYear(users, memberships, year);
                const yearUsers = memberships.length > 0
                    ? allYearUsers.filter(u => memberships.some(m => m.userId === u.id))
                    : allYearUsers;
                const stats = computeActivityStats(activities, groupSets, yearUsers, completions);
                const pointsBySet = new Map<string, number>();
                completions.forEach(c => {
                    pointsBySet.set(c.setId, (pointsBySet.get(c.setId) ?? 0) + c.earnedPoints);
                });
                const topSets = groupSets
                    .map(set => ({
                        name: set.name,
                        branch: branchNameForLevel(set.level),
                        points: pointsBySet.get(set.id ?? '') ?? 0
                    }))
                    .sort((a, b) => b.points - a.points)
                    .slice(0, 3);

                result.push({
                    year,
                    activities,
                    completions,
                    members: yearUsers.filter(u => u.type !== UserType.BENEFICIARIO),
                    totalPoints: completions.reduce((sum, c) => sum + c.earnedPoints, 0),
                    completedCount: stats.completedCount,
                    executiveCount: yearUsers.filter(u => u.type === UserType.DIRIGENTE).length,
                    activeSets: new Set(completions.map(c => c.setId)).size,
                    topSets
                });
            }

            this.history.set(result);
            this.years.set(result.map(r => r.year));
            this.selectedYear.set(result[0]?.year ?? null);
            this.expandedYear.set(result[0]?.year ?? null);
        } catch (err) {
            console.error('Error al cargar el histórico:', err);
        } finally {
            this.isLoading.set(false);
        }
    }

    toggleYear(year: number): void {
        this.expandedYear.set(this.expandedYear() === year ? null : year);
    }

    branchName(level: any): string | null {
        return branchNameForLevel(level);
    }

    unitName(level: any): string | null {
        return unitNameForLevel(level);
    }
}
