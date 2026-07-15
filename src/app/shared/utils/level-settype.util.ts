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
