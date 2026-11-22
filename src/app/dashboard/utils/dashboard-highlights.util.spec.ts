import {Activity} from '../../activities/models';
import {UserLevel} from '../../users/models';
import {dayDistanceLabel, featuredActivity, nextBirthday, progressPercent} from './dashboard-highlights.util';

describe('dashboard highlights', () => {
    const now = new Date('2026-11-22T10:00:00Z');

    function activity(id: string, scheduledAt?: Date): Activity {
        return {
            id, name: `Actividad ${id}`, key: id, level: UserLevel.SCOUT,
            points: 3, createdAt: now, scheduledAt
        };
    }

    describe('progressPercent', () => {
        it('calcula el porcentaje de actividades completadas', () => {
            expect(progressPercent(12, 12)).toBe(100);
            expect(progressPercent(0, 12)).toBe(0);
            expect(progressPercent(1, 3)).toBe(33);
        });

        it('evita divisiones por cero y valores fuera de rango', () => {
            expect(progressPercent(0, 0)).toBe(0);
            expect(progressPercent(15, 12)).toBe(100);
        });
    });

    describe('featuredActivity', () => {
        it('elige la próxima actividad programada', () => {
            const past = activity('pasada', new Date('2026-11-01T10:00:00Z'));
            const next = activity('proxima', new Date('2026-11-25T10:00:00Z'));
            const later = activity('despues', new Date('2026-12-01T10:00:00Z'));

            const result = featuredActivity([past, later, next], now);

            expect(result?.activity.id).toBe('proxima');
            expect(result?.upcoming).toBeTrue();
            expect(result?.days).toBe(3);
        });

        it('muestra la última actividad si no quedan futuras', () => {
            const first = activity('primera', new Date('2026-10-01T10:00:00Z'));
            const last = activity('ultima', new Date('2026-11-21T19:00:00Z'));

            const result = featuredActivity([last, first], now);

            expect(result?.activity.id).toBe('ultima');
            expect(result?.upcoming).toBeFalse();
            expect(result?.days).toBe(-1);
        });

        it('ignora actividades sin fecha y devuelve null si no hay ninguna', () => {
            expect(featuredActivity([activity('sin-fecha')], now)).toBeNull();
            expect(featuredActivity([], now)).toBeNull();
        });
    });

    describe('nextBirthday', () => {
        it('devuelve el cumpleaños de este año cuando aún no pasó', () => {
            const result = nextBirthday(new Date('1993-12-28T03:00:00Z'), now);

            expect(result?.date.getDate()).toBe(28);
            expect(result?.date.getMonth()).toBe(11);
            expect(result?.date.getFullYear()).toBe(2026);
            expect(result?.days).toBe(36);
        });

        it('pasa al año siguiente cuando ya ocurrió', () => {
            const result = nextBirthday(new Date('1993-01-15T03:00:00Z'), now);

            expect(result?.date.getFullYear()).toBe(2027);
            expect(result?.days).toBe(54);
        });

        it('detecta el cumpleaños de hoy', () => {
            expect(nextBirthday(new Date('1993-11-22T03:00:00Z'), now)?.days).toBe(0);
        });

        it('maneja el 29 de febrero en años no bisiestos', () => {
            const result = nextBirthday(new Date('2000-02-29T03:00:00Z'), new Date('2027-01-01T10:00:00Z'));

            expect(result?.date.getMonth()).toBe(2);
            expect(result?.date.getDate()).toBe(1);
        });

        it('devuelve null sin fecha de nacimiento', () => {
            expect(nextBirthday(null, now)).toBeNull();
        });
    });

    describe('dayDistanceLabel', () => {
        it('describe la distancia en días en español', () => {
            expect(dayDistanceLabel(0)).toBe('Hoy');
            expect(dayDistanceLabel(1)).toBe('Mañana');
            expect(dayDistanceLabel(5)).toBe('En 5 días');
            expect(dayDistanceLabel(-1)).toBe('Ayer');
            expect(dayDistanceLabel(-3)).toBe('Hace 3 días');
        });
    });
});
