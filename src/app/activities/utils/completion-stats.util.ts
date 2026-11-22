import {Activity, ActivityCompletion} from '../models';
import {Set as ScoutSet} from '../../sets/models';
import {User} from '../../users/models';

export interface ActivitySetStats {
    setId: string;
    /** Actividades completadas por esta sección (sin duplicados). */
    completedActivityIds: Set<string>;
    /** Cantidad de actividades del nivel de la sección. */
    totalActivities: number;
    completedCount: number;
}

export interface ActivityStats {
    /** Actividades completadas por al menos una sección. */
    completedActivityIds: Set<string>;
    completedCount: number;
    totalActivities: number;
    activitiesById: Map<string, Activity>;
    bySet: Map<string, ActivitySetStats>;
    isSectionCompleted(activityId: string, setId: string): boolean;
}

/**
 * Una sección completó una actividad cuando todos sus integrantes tienen una
 * completación, o cuando existe una completación histórica cargada por un
 * dirigente para la sección (ese registro no pertenece a ningún integrante).
 * Las secciones sin integrantes no cuentan salvo que tengan ese registro histórico.
 */
function sectionCompleted(
    members: User[],
    completions: ActivityCompletion[]
): boolean {
    const memberIds = new Set(members.map(u => u.id).filter((id): id is string => !!id));

    if (completions.some(c => !c.userId || !memberIds.has(c.userId))) {
        return true;
    }

    if (memberIds.size === 0) return false;

    return [...memberIds].every(id => completions.some(c => c.userId === id));
}

export function computeActivityStats(
    activities: Activity[],
    sets: ScoutSet[],
    users: User[],
    completions: ActivityCompletion[]
): ActivityStats {
    const activitiesById = new Map(
        activities.filter(a => !!a.id).map(a => [a.id!, a])
    );

    const membersBySet = new Map<string, User[]>();
    for (const user of users) {
        if (!user.setId) continue;
        const members = membersBySet.get(user.setId) ?? [];
        members.push(user);
        membersBySet.set(user.setId, members);
    }

    const completionsByPair = new Map<string, ActivityCompletion[]>();
    for (const completion of completions) {
        if (!completion.setId) continue;
        const key = `${completion.activityId}|${completion.setId}`;
        const list = completionsByPair.get(key) ?? [];
        list.push(completion);
        completionsByPair.set(key, list);
    }

    const bySet = new Map<string, ActivitySetStats>();
    const completedActivityIds = new Set<string>();

    for (const set of sets) {
        if (!set.id) continue;

        const setActivities = activities.filter(a => a.level === set.level);
        const completed = new Set<string>();

        for (const activity of setActivities) {
            if (!activity.id) continue;
            const pairCompletions = completionsByPair.get(`${activity.id}|${set.id}`) ?? [];
            if (sectionCompleted(membersBySet.get(set.id) ?? [], pairCompletions)) {
                completed.add(activity.id);
                completedActivityIds.add(activity.id);
            }
        }

        bySet.set(set.id, {
            setId: set.id,
            completedActivityIds: completed,
            totalActivities: setActivities.length,
            completedCount: completed.size
        });
    }

    return {
        completedActivityIds,
        completedCount: completedActivityIds.size,
        totalActivities: activities.length,
        activitiesById,
        bySet,
        isSectionCompleted: (activityId, setId) =>
            bySet.get(setId)?.completedActivityIds.has(activityId) ?? false
    };
}
