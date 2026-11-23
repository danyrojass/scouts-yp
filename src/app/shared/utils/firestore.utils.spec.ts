import {
    activityCompletionToFirestore,
    activityToFirestore,
    firestoreToActivity,
    firestoreToActivityCompletion,
    firestoreToGroup,
    firestoreToSet,
    firestoreToMembership,
    groupToFirestore,
    setToFirestore
} from './firestore.utils';
import {UserLevel} from '../../users/models';

describe('firestoreToSet', () => {
    it('deriva level desde el type histórico de Firestore', () => {
        expect(firestoreToSet({name: 'Lobo', type: 'Patrulla'}).level).toBe(UserLevel.SCOUT);
        expect(firestoreToSet({name: 'Blanca', type: 'Seisena'}).level).toBe(UserLevel.LOBATO);
        expect(firestoreToSet({name: 'Teju Jagua', type: 'Equipo'}).level).toBe(UserLevel.CAMINANTE);
        expect(firestoreToSet({name: 'Clan', type: 'Clan'}).level).toBe(UserLevel.ROVER);
    });

    it('respeta level cuando el documento ya fue migrado', () => {
        expect(firestoreToSet({name: 'Lobo', type: 'Patrulla', level: UserLevel.ROVER}).level)
            .toBe(UserLevel.ROVER);
    });

    it('no inventa un level para tipos desconocidos', () => {
        expect(firestoreToSet({name: 'Otro', type: 'Otro'}).level).toBeNull();
    });

    it('considera activas las secciones históricas y respeta una baja', () => {
        expect(firestoreToSet({name: 'Lobo', type: 'Patrulla'}).active).toBeTrue();
        expect(firestoreToSet({name: 'Lobo', type: 'Patrulla', active: false}).active).toBeFalse();
    });

    it('no escribe campos de año ni de estado en updates parciales', () => {
        expect(setToFirestore({active: false}).active).toBeFalse();
        expect(Object.keys(setToFirestore({active: false}))).not.toContain('group_id');
    });
});

describe('mapeo de año lectivo', () => {
    it('etiqueta documentos históricos con 2026', () => {
        expect(firestoreToGroup({name: 'Ypacaraí'}).activeYear).toBe(2026);
        expect(firestoreToGroup({name: 'Ypacaraí'}).years).toEqual([2026]);
        expect(firestoreToActivity({name: 'Fuego'}).year).toBe(2026);
        expect(firestoreToActivityCompletion({earned_points: 3}).year).toBe(2026);
        expect(firestoreToMembership({user_id: 'u1'}).year).toBe(2026);
    });

    it('respeta el año guardado y la lista de años', () => {
        const group = firestoreToGroup({active_year: 2027, years: [2026, 2027]});
        expect(group.activeYear).toBe(2027);
        expect(group.years).toEqual([2026, 2027]);
    });

    it('escribe year/active_year sólo cuando vienen en el objeto', () => {
        expect(Object.keys(groupToFirestore({name: 'Ypacaraí'}))).not.toContain('active_year');
        expect(groupToFirestore({activeYear: 2027}).active_year).toBe(2027);
        expect(Object.keys(activityToFirestore({name: 'Fuego'}))).not.toContain('year');
        expect(activityToFirestore({year: 2027}).year).toBe(2027);
        expect(Object.keys(activityCompletionToFirestore({earnedPoints: 3}))).not.toContain('year');
        expect(activityCompletionToFirestore({year: 2027}).year).toBe(2027);
    });
});
