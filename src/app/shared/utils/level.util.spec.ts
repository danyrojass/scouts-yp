import {UserLevel} from '../../users/models';
import {branchNameForLevel, unitNameForLevel, YOUTH_LEVELS} from './level.util';

describe('level labels', () => {
    it('muestra las ramas con la terminología del grupo', () => {
        expect(branchNameForLevel(UserLevel.LOBATO)).toBe('Manada');
        expect(branchNameForLevel(UserLevel.SCOUT)).toBe('Tropa');
        expect(branchNameForLevel(UserLevel.CAMINANTE)).toBe('Comunidad');
        expect(branchNameForLevel(UserLevel.ROVER)).toBe('Clan');
        expect(branchNameForLevel(UserLevel.JEFE)).toBe('Jefe');
    });

    it('devuelve null sin nivel', () => {
        expect(branchNameForLevel(null)).toBeNull();
        expect(branchNameForLevel(undefined)).toBeNull();
    });

    it('mantiene las unidades chicas sin cambios, incluido Clan en Rover', () => {
        expect(unitNameForLevel(UserLevel.LOBATO)).toBe('Seisena');
        expect(unitNameForLevel(UserLevel.SCOUT)).toBe('Patrulla');
        expect(unitNameForLevel(UserLevel.CAMINANTE)).toBe('Equipo');
        expect(unitNameForLevel(UserLevel.ROVER)).toBe('Clan');
        expect(unitNameForLevel(UserLevel.JEFE)).toBeNull();
    });

    it('sólo las cuatro ramas juveniles pueden tener sección', () => {
        expect(YOUTH_LEVELS).toEqual([
            UserLevel.LOBATO, UserLevel.SCOUT, UserLevel.CAMINANTE, UserLevel.ROVER
        ]);
    });
});
