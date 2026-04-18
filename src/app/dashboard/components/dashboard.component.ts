import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {filter, take} from 'rxjs/operators';
import {firstValueFrom} from 'rxjs';

import {AuthService} from '../../auth/services/auth.service';
import {GroupService} from '../../groups/services/group.service';
import {UserService} from '../../users/services/user.service';
import {SetService} from '../../sets/services/set.service';
import {ActivityService} from '../../activities/services/activity.service';

import {User, UserType} from '../../users/models';
import {Group} from '../../groups/models';
import {Set} from '../../sets/models';
import {Activity, ActivityCompletion} from '../../activities/models';
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

    totalPoints = computed(() => {
        const user = this.currentUser();
        if (!user?.groupId) return 0;

        return this.completedActivities()
            .filter(c => c.groupId === user.groupId)
            .reduce((sum, c) => sum + c.earnedPoints, 0);
    });

    isLoading = computed(() => this.currentUser() === null);

    protected readonly UserType = UserType;

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

            const [group, users, allSets, allActivities, completions] = await Promise.all([
                firstValueFrom(this.groupService.getGroupById(user.groupId!)),
                firstValueFrom(this.userService.getUsersByGroup(user.groupId!)),
                firstValueFrom(this.setService.getSets()),
                firstValueFrom(this.activityService.getActivities()),
                firstValueFrom(this.activityService.getActivityCompletions(user.groupId!))
            ]);

            const isJefe = user.type === UserType.JEFE;
            let filteredSets = allSets;
            let filteredActivities = allActivities;

            filteredSets = filteredSets.filter(s => s.groupId === user.groupId);
            if (!isJefe) {
                if (user.setId) {
                    const userSet = filteredSets.find(s => s.id === user.setId);
                    if (userSet) {
                        filteredSets = filteredSets.filter(s => s.type === userSet.type);
                    }
                }
                filteredActivities = filteredActivities.filter(a => a.level === user.level);
            }

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
