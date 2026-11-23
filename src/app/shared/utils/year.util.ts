import {Membership} from '../../memberships/models/membership.model';
import {User} from '../../users/models';

/** Año lectivo con el que se etiquetaron los datos históricos de Firestore. */
export const DEFAULT_YEAR = 2026;

/** Los documentos viejos no tenían año: se consideran del primer año lectivo. */
export function yearFor(year?: number | string | null): number {
    const value = Number(year);
    return Number.isFinite(value) && value > 0 ? value : DEFAULT_YEAR;
}

/** Devuelve los integrantes de un año, con el rol/nivel/sección de ese año. */
export function usersForYear(users: User[], memberships: Membership[], year: number): User[] {
    const byUser = new Map(
        memberships
            .filter(m => m.year === year)
            .map(m => [m.userId, m] as const)
    );

    return users.map(user => {
        const membership = user.id ? byUser.get(user.id) : undefined;
        if (!membership) return user;
        return {
            ...user,
            type: membership.type,
            level: membership.level,
            setId: membership.setId
        };
    });
}
