import {Activity} from '../../activities/models';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface FeaturedActivity {
    activity: Activity;
    upcoming: boolean;
    days: number;
}

export interface BirthdayHighlight {
    date: Date;
    days: number;
}

function toTime(value: Date | null | undefined): number | null {
    if (!value) return null;
    const time = new Date(value).getTime();
    return isNaN(time) ? null : time;
}

function daysBetween(from: Date, to: Date): number {
    const start = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
    const end = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
    return Math.round((end - start) / MS_PER_DAY);
}

export function progressPercent(completed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(100, Math.max(0, Math.round((completed / total) * 100)));
}

/** Próxima actividad programada; si ya no hay, la última para no dejar un card vacío. */
export function featuredActivity(activities: Activity[], now: Date = new Date()): FeaturedActivity | null {
    const scheduled = activities
        .map(activity => ({activity, time: toTime(activity.scheduledAt)}))
        .filter((item): item is {activity: Activity; time: number} => item.time !== null)
        .sort((a, b) => a.time - b.time);

    if (scheduled.length === 0) return null;

    const next = scheduled.find(item => item.time >= now.getTime()) ?? scheduled[scheduled.length - 1];
    const activityDate = new Date(next.time);

    return {
        activity: next.activity,
        upcoming: next.time >= now.getTime(),
        days: daysBetween(now, activityDate)
    };
}

/** Próximo cumpleaños a partir de una fecha de nacimiento (maneja años bisiestos). */
export function nextBirthday(dateOfBirth: Date | null | undefined, now: Date = new Date()): BirthdayHighlight | null {
    const time = toTime(dateOfBirth);
    if (time === null) return null;

    const birthDate = new Date(time);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    let next = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());

    if (next.getTime() < today) {
        next = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
    }

    return {date: next, days: Math.round((next.getTime() - today) / MS_PER_DAY)};
}

export function dayDistanceLabel(days: number): string {
    if (days === 0) return 'Hoy';
    if (days === 1) return 'Mañana';
    if (days > 1) return `En ${days} días`;
    if (days === -1) return 'Ayer';
    return `Hace ${Math.abs(days)} días`;
}
