import {UserLevel} from '../../users/models';

/**
 * Nombre de la unidad chica que corresponde a cada rama.
 * La sección guarda su `level`; el nombre visible se deriva de acá.
 * `JEFE` no tiene unidad: los dirigentes no pertenecen a una sección.
 */
export const UNIT_NAME_BY_LEVEL: Record<UserLevel, string | null> = {
    [UserLevel.LOBATO]: 'Seisena',
    [UserLevel.SCOUT]: 'Patrulla',
    [UserLevel.CAMINANTE]: 'Equipo',
    [UserLevel.ROVER]: 'Clan',
    [UserLevel.JEFE]: null,
};

export function unitNameForLevel(level: UserLevel | null | undefined): string | null {
    if (!level) return null;
    return UNIT_NAME_BY_LEVEL[level] ?? null;
}

/**
 * Nombre visible de la rama. Los valores guardados (`Lobato`, `Scout`, ...)
 * no se migran: acá sólo se traducen a la terminación usada por el grupo.
 */
export const BRANCH_NAME_BY_LEVEL: Record<UserLevel, string> = {
    [UserLevel.LOBATO]: 'Manada',
    [UserLevel.SCOUT]: 'Tropa',
    [UserLevel.CAMINANTE]: 'Comunidad',
    [UserLevel.ROVER]: 'Clan',
    [UserLevel.JEFE]: 'Jefe',
};

export function branchNameForLevel(level: UserLevel | string | null | undefined): string | null {
    if (!level) return null;
    return BRANCH_NAME_BY_LEVEL[level as UserLevel] ?? null;
}

/** Niveles juveniles: son los únicos que pueden tener una sección. */
export const YOUTH_LEVELS: UserLevel[] = [
    UserLevel.LOBATO,
    UserLevel.SCOUT,
    UserLevel.CAMINANTE,
    UserLevel.ROVER,
];

/** Orden canónico de niveles (de menor a mayor). */
export const USER_LEVEL_ORDER: UserLevel[] = [...YOUTH_LEVELS, UserLevel.JEFE];

export function getSetsForLevel<T extends { level: UserLevel }>(sets: T[], level: UserLevel): T[] {
    return sets.filter(s => s.level === level);
}

export interface GroupByLevel<T> {
    level: UserLevel;
    unitName: string | null;
    items: T[];
}

/**
 * Agrupa elementos por `level` respetando USER_LEVEL_ORDER y expone el nombre
 * de la unidad que corresponde a cada nivel (Lobato → Seisena, ...).
 * Los grupos sin items se omiten.
 */
export function groupByLevel<T extends { level: UserLevel }>(items: T[]): GroupByLevel<T>[] {
    return USER_LEVEL_ORDER
        .map(level => ({
            level,
            unitName: unitNameForLevel(level),
            items: items.filter(item => item.level === level),
        }))
        .filter(group => group.items.length > 0);
}
