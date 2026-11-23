import {UserLevel} from '../../users/models';
import {yearFor} from './year.util';

/** Datos históricos: las secciones guardaban `type` en vez de `level`. */
const LEGACY_LEVEL_BY_UNIT: Record<string, UserLevel> = {
    seisena: UserLevel.LOBATO,
    patrulla: UserLevel.SCOUT,
    equipo: UserLevel.CAMINANTE,
    clan: UserLevel.ROVER,
    lobato: UserLevel.LOBATO,
    scout: UserLevel.SCOUT,
    caminante: UserLevel.CAMINANTE,
    rover: UserLevel.ROVER,
};

function toDate(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
    if (typeof value.toDate === 'function') return value.toDate();
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

export function firestoreToUser(data: any): any {
    if (!data) return data;
    return {
        ...data,
        groupId: data.group_id ?? data.groupId ?? null,
        setId: data.set_id ?? data.setId ?? null,
        dateOfBirth: toDate(data.date_of_birth ?? data.dateOfBirth),
        createdAt: toDate(data.created_at ?? data.createdAt),
    };
}

export function userToFirestore(user: any): any {
    return {
        ...user,
        group_id: user.groupId,
        set_id: user.setId,
        date_of_birth: user.dateOfBirth,
        created_at: user.createdAt instanceof Date ? user.createdAt : (user.createdAt ? new Date(user.createdAt) : new Date()),
    };
}

export function firestoreToGroup(data: any): any {
    if (!data) return data;
    return {
        ...data,
        createdAt: toDate(data.created_at ?? data.createdAt),
        activeYear: yearFor(data.active_year ?? data.activeYear),
        years: Array.isArray(data.years) && data.years.length > 0
            ? data.years.map(yearFor)
            : [yearFor(data.active_year ?? data.activeYear)],
    };
}

export function groupToFirestore(group: any): any {
    return {
        ...group,
        created_at: group.createdAt instanceof Date ? group.createdAt : (group.createdAt ? new Date(group.createdAt) : new Date()),
        ...(group.activeYear !== undefined ? {active_year: yearFor(group.activeYear)} : {}),
        ...(group.years !== undefined ? {years: group.years} : {}),
    };
}

export function firestoreToSet(data: any): any {
    if (!data) return data;
    return {
        ...data,
        groupId: data.group_id ?? data.groupId ?? null,
        level: data.level ?? LEGACY_LEVEL_BY_UNIT[String(data.type ?? '').trim().toLowerCase()] ?? null,
        createdAt: toDate(data.created_at ?? data.createdAt),
        active: data.active ?? data.is_active ?? true,
    };
}

export function setToFirestore(set: any): any {
    return {
        ...set,
        ...(set.groupId !== undefined ? {group_id: set.groupId} : {}),
        ...(set.createdAt !== undefined
            ? {created_at: set.createdAt instanceof Date ? set.createdAt : new Date(set.createdAt)}
            : {}),
        ...(set.active !== undefined ? {active: set.active !== false} : {}),
    };
}

export function firestoreToActivity(data: any): any {
    if (!data) return data;
    return {
        ...data,
        createdAt: toDate(data.created_at ?? data.createdAt),
        scheduledAt: toDate(data.scheduled_at ?? data.scheduledAt),
        year: yearFor(data.year),
    };
}

export function activityToFirestore(activity: any): any {
    return {
        ...activity,
        created_at: activity.createdAt instanceof Date ? activity.createdAt : (activity.createdAt ? new Date(activity.createdAt) : new Date()),
        scheduled_at: activity.scheduledAt instanceof Date ? activity.scheduledAt : (activity.scheduledAt ? new Date(activity.scheduledAt) : null),
        ...(activity.year !== undefined ? {year: yearFor(activity.year)} : {}),
    };
}

export function firestoreToActivityCompletion(data: any): any {
    if (!data) return data;
    return {
        ...data,
        activityId: data.activity_id ?? data.activityId ?? null,
        groupId: data.group_id ?? data.groupId ?? null,
        userId: data.user_id ?? data.userId ?? null,
        setId: data.set_id ?? data.setId ?? null,
        earnedPoints: data.earned_points ?? data.earnedPoints ?? 0,
        completedAt: toDate(data.completed_at ?? data.completedAt),
        year: yearFor(data.year),
    };
}

export function activityCompletionToFirestore(completion: any): any {
    return {
        ...completion,
        activity_id: completion.activityId,
        group_id: completion.groupId,
        user_id: completion.userId,
        completed_at: completion.completedAt instanceof Date ? completion.completedAt : (completion.completedAt ? new Date(completion.completedAt) : new Date()),
        ...(completion.year !== undefined ? {year: yearFor(completion.year)} : {}),
    };
}

export function firestoreToMembership(data: any): any {
    if (!data) return data;
    return {
        ...data,
        userId: data.user_id ?? data.userId ?? null,
        groupId: data.group_id ?? data.groupId ?? null,
        year: yearFor(data.year),
        setId: data.set_id ?? data.setId ?? null,
        active: data.active ?? data.is_active ?? true,
        createdAt: toDate(data.created_at ?? data.createdAt),
    };
}

export function membershipToFirestore(membership: any): any {
    return {
        user_id: membership.userId,
        group_id: membership.groupId,
        year: yearFor(membership.year),
        type: membership.type,
        level: membership.level,
        set_id: membership.setId,
        active: membership.active !== false,
        created_at: membership.createdAt instanceof Date ? membership.createdAt : (membership.createdAt ? new Date(membership.createdAt) : new Date()),
    };
}
