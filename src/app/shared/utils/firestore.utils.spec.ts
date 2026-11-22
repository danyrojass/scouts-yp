import {firestoreToSet} from './firestore.utils';
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
});
