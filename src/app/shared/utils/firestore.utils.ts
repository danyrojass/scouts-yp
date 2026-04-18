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
    };
}

export function groupToFirestore(group: any): any {
    return {
        ...group,
        created_at: group.createdAt instanceof Date ? group.createdAt : (group.createdAt ? new Date(group.createdAt) : new Date()),
    };
}

export function firestoreToSet(data: any): any {
    if (!data) return data;
    return {
        ...data,
        groupId: data.group_id ?? data.groupId ?? null,
        createdAt: toDate(data.created_at ?? data.createdAt),
    };
}

export function setToFirestore(set: any): any {
    return {
        ...set,
        group_id: set.groupId,
        created_at: set.createdAt instanceof Date ? set.createdAt : (set.createdAt ? new Date(set.createdAt) : new Date()),
    };
}

export function firestoreToActivity(data: any): any {
    if (!data) return data;
    return {
        ...data,
        createdAt: toDate(data.created_at ?? data.createdAt),
    };
}

export function activityToFirestore(activity: any): any {
    return {
        ...activity,
        created_at: activity.createdAt instanceof Date ? activity.createdAt : (activity.createdAt ? new Date(activity.createdAt) : new Date()),
    };
}

export function firestoreToActivityCompletion(data: any): any {
    if (!data) return data;
    return {
        ...data,
        activityId: data.activity_id ?? data.activityId ?? null,
        groupId: data.group_id ?? data.groupId ?? null,
        userId: data.user_id ?? data.userId ?? null,
        completedAt: toDate(data.completed_at ?? data.completedAt),
    };
}

export function activityCompletionToFirestore(completion: any): any {
    return {
        ...completion,
        activity_id: completion.activityId,
        group_id: completion.groupId,
        user_id: completion.userId,
        completed_at: completion.completedAt instanceof Date ? completion.completedAt : (completion.completedAt ? new Date(completion.completedAt) : new Date()),
    };
}
