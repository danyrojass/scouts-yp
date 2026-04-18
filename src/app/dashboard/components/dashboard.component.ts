import {Component, OnInit} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule} from '@angular/router';
import {AuthService} from '../../auth/services/auth.service';
import {GroupService} from '../../groups/services/group.service';
import {UserService} from '../../users/services/user.service';
import {ActivityService} from '../../activities/services/activity.service';
import {SetService} from '../../sets/services/set.service';
import {User, UserType} from '../../users/models';
import {Group} from '../../groups/models';
import {Set} from '../../sets/models';
import {Activity, ActivityCompletion} from '../../activities/models';
import {LoadingSpinnerComponent} from '../../shared/components';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LoadingSpinnerComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  userGroup: Group | null = null;
  userSet: Set | null = null;
  groupUsers: User[] = [];
  groupSets: Set[] = [];
  activities: Activity[] = [];
  completedActivities: ActivityCompletion[] = [];
  totalPoints = 0;
  isLoading = true;
  protected readonly UserType = UserType;

  constructor(
    private authService: AuthService,
    private groupService: GroupService,
    private userService: UserService,
    private setService: SetService,
    private activityService: ActivityService
  ) {
  }

  ngOnInit(): void {
    this.loadUserData();
  }

  loadUserData(): void {
    this.isLoading = true;

    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;

      if (user) {
        if (user.groupId) {
          this.loadGroupData(user.groupId);
        } else {
          this.isLoading = false;
        }

        if (user.setId) {
          this.loadSetData(user.setId);
        }

        this.loadActivityData(user);
      } else {
        this.isLoading = false;
      }
    });
  }

  loadGroupData(groupId: string): void {
    this.groupService.getGroupById(groupId).subscribe(group => {
      this.userGroup = group;

      this.userService.getUsersByGroup(groupId).subscribe(users => {
        this.groupUsers = users;
      });

      this.setService.getSetsByGroup(groupId).subscribe(sets => {
        this.groupSets = sets;
        this.isLoading = false;
      });
    });
  }

  loadSetData(setId: string): void {
    this.setService.getSetById(setId).subscribe(set => {
      this.userSet = set;
    });
  }

  loadActivityData(user: User): void {
    this.activityService.getActivitiesByLevel(user.level).subscribe(activities => {
      this.activities = activities;
    });

    if (user.groupId) {
      this.activityService.getActivityCompletions(user.groupId).subscribe(completions => {
        this.completedActivities = completions;
        this.calculateTotalPoints();
      });
    }
  }

  calculateTotalPoints(): void {
    if (!this.currentUser || !this.currentUser.groupId) return;

    let groupTotal = 0;

    this.completedActivities.forEach(completion => {
      if (completion.groupId === this.currentUser?.groupId) {
        groupTotal += completion.earnedPoints;
      }
    });

    this.totalPoints = groupTotal;
  }
}
