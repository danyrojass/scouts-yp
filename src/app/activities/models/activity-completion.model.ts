export interface ActivityCompletion {
    id?: string;
    activityId: string;
    setId: string;
    userId: string;
    completedAt: Date;
    earnedPoints: number;
    /** Año lectivo de los puntos, para poder comparar años sin mezclarlos. */
    year?: number;
}