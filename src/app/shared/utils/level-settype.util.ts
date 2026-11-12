import {UserLevel} from '../../users/models';
import {SetType} from '../../sets/models';

const levelToSetTypeMap: Record<UserLevel, SetType | null> = {
    [UserLevel.LOBATO]: SetType.SEISENA,
    [UserLevel.SCOUT]: SetType.PATRULLA,
    [UserLevel.CAMINANTE]: SetType.EQUIPO,
    [UserLevel.ROVER]: SetType.CLAN,
    [UserLevel.JEFE]: null,
};

export function levelToSetType(level: UserLevel): SetType | null {
    return levelToSetTypeMap[level] ?? null;
}

export function setTypeToLevel(type: SetType): UserLevel | null {
    const entries = Object.entries(levelToSetTypeMap) as [UserLevel, SetType | null][];
    const match = entries.find(([, st]) => st === type);
    return match ? match[0] : null;
}

export function getSetsForLevel<T extends { type: SetType }>(sets: T[], level: UserLevel): T[] {
    const target = levelToSetType(level);
    if (!target) return sets;
    return sets.filter(s => s.type === target);
}

/** Orden canónico de niveles (de menor a mayor). */
export const USER_LEVEL_ORDER: UserLevel[] = [
    UserLevel.LOBATO,
    UserLevel.SCOUT,
    UserLevel.CAMINANTE,
    UserLevel.ROVER,
    UserLevel.JEFE,
];

export interface GroupByLevel<T> {
    level: UserLevel;
    setType: SetType | null;
    items: T[];
}

/**
 * Agrupa actividades por `level` respetando USER_LEVEL_ORDER y expone el
 * SetType que corresponde a cada nivel (Lobato→Seisena, Scout→Patrulla, ...).
 * Los grupos sin items se omiten.
 */
export function groupByLevel<T extends { level: UserLevel }>(items: T[]): GroupByLevel<T>[] {
    return USER_LEVEL_ORDER
        .map(level => ({
            level,
            setType: levelToSetType(level),
            items: items.filter(item => item.level === level),
        }))
        .filter(group => group.items.length > 0);
}
