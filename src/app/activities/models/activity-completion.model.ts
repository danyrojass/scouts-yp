export interface ActivityCompletion {
  id?: string;
  activityId: string;
  groupId: string;
  userId: string;
  completedAt: Date;
  earnedPoints: number;
}