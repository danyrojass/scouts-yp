import {UserLevel, UserType} from '../../users/models';

/**
 * Pertenencia de una persona a un año lectivo. La identidad sigue en `users`;
 * acá viven el rol, el nivel y la sección que cambian año a año.
 */
export interface Membership {
    id?: string;
    userId: string;
    groupId: string | null;
    year: number;
    type: UserType;
    level: UserLevel;
    setId: string | null;
    active: boolean;
    createdAt: Date;
}
