export interface ActivityCompletion {
    id?: string;
    activityId: string;
    setId: string;
    userId: string;
    completedAt: Date;
    earnedPoints: number;
}