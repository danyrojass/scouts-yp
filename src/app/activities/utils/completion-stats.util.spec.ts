import {computeActivityStats} from './completion-stats.util';
import {Activity, ActivityCompletion} from '../models';
import {Set} from '../../sets/models';
import {User, UserLevel, UserType} from '../../users/models';

describe('computeActivityStats', () => {
    const now = new Date('2026-11-21T12:00:00Z');
    const patrol: Set = {id: 'set-1', name: 'Aguara', level: UserLevel.SCOUT, groupId: 'g1', createdAt: now};
    const activity: Activity = {
        id: 'act-1', name: 'Carrera', key: 'carrera', level: UserLevel.SCOUT, points: 3, createdAt: now
    };
    const otherActivity: Activity = {
        id: 'act-2', name: 'Carpas', key: 'carpas', level: UserLevel.SCOUT, points: 2, createdAt: now
    };

    function member(id: string): User {
        return {
            id, name: id, email: `${id}@test.com`, dateOfBirth: null,
            type: UserType.BENEFICIARIO, level: UserLevel.SCOUT,
            groupId: 'g1', setId: 'set-1', createdAt: now
        };
    }

    function completion(activityId: string, userId: string): ActivityCompletion {
        return {
            activityId, setId: 'set-1', userId, completedAt: now, earnedPoints: 3
        };
    }

    it('cuenta actividades distintas, no registros de completación', () => {
        const stats = computeActivityStats(
            [activity, otherActivity], [patrol],
            [member('u1'), member('u2')],
            [completion('act-1', 'u1'), completion('act-1', 'u2')]
        );

        expect(stats.completedCount).toBe(1);
        expect(stats.bySet.get('set-1')?.completedCount).toBe(1);
        expect(stats.bySet.get('set-1')?.totalActivities).toBe(2);
        expect(stats.isSectionCompleted('act-1', 'set-1')).toBeTrue();
        expect(stats.isSectionCompleted('act-2', 'set-1')).toBeFalse();
    });

    it('no cuenta la actividad si falta la completación de un integrante', () => {
        const stats = computeActivityStats(
            [activity], [patrol], [member('u1'), member('u2')],
            [completion('act-1', 'u1')]
        );

        expect(stats.completedCount).toBe(0);
    });

    it('cuenta la completación histórica atribuida a un dirigente', () => {
        const stats = computeActivityStats(
            [activity], [patrol], [member('u1'), member('u2')],
            [completion('act-1', 'dirigente')]
        );

        expect(stats.completedCount).toBe(1);
    });

    it('no cuenta secciones vacías salvo que tengan registro histórico', () => {
        const emptySet: Set = {...patrol, id: 'set-2', name: 'Lobo'};

        const withoutCompletion = computeActivityStats([activity], [emptySet], [], []);
        expect(withoutCompletion.completedCount).toBe(0);

        const withLegacy = computeActivityStats(
            [activity], [emptySet], [],
            [{...completion('act-1', 'dirigente'), setId: 'set-2'}]
        );
        expect(withLegacy.completedCount).toBe(1);
    });

    it('mide cada sección sobre las actividades de su nivel', () => {
        const seisena: Set = {...patrol, id: 'set-3', name: 'Seisena', level: UserLevel.LOBATO};

        const stats = computeActivityStats([activity], [patrol, seisena], [member('u1')], []);

        expect(stats.bySet.get('set-1')?.totalActivities).toBe(1);
        expect(stats.bySet.get('set-3')?.totalActivities).toBe(0);
    });
});
