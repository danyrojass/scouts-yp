import {DEFAULT_YEAR, usersForYear, yearFor} from './year.util';
import {User, UserLevel, UserType} from '../../users/models';
import {Membership} from '../../memberships/models/membership.model';

function user(id: string, overrides: Partial<User> = {}): User {
    return {
        id,
        name: id,
        email: `${id}@test.com`,
        dateOfBirth: null,
        type: UserType.BENEFICIARIO,
        level: UserLevel.LOBATO,
        groupId: 'g1',
        setId: null,
        createdAt: new Date(),
        ...overrides
    };
}

function membership(userId: string, year: number, overrides: Partial<Membership> = {}): Membership {
    return {
        userId,
        groupId: 'g1',
        year,
        type: UserType.BENEFICIARIO,
        level: UserLevel.LOBATO,
        setId: null,
        active: true,
        createdAt: new Date(),
        ...overrides
    };
}

describe('yearFor', () => {
    it('usa el año por defecto para documentos históricos sin year', () => {
        expect(yearFor(undefined)).toBe(DEFAULT_YEAR);
        expect(yearFor(null)).toBe(DEFAULT_YEAR);
        expect(yearFor('')).toBe(DEFAULT_YEAR);
        expect(yearFor(0)).toBe(DEFAULT_YEAR);
    });

    it('respeta años explícitos', () => {
        expect(yearFor(2026)).toBe(2026);
        expect(yearFor('2027')).toBe(2027);
    });
});

describe('usersForYear', () => {
    const users = [
        user('u1', {type: UserType.DIRIGENTE, level: UserLevel.JEFE}),
        user('u2')
    ];

    it('aplica rol, nivel y sección de la membresía del año pedido', () => {
        const memberships = [
            membership('u1', 2026, {type: UserType.DIRIGENTE, level: UserLevel.JEFE, setId: 's1'}),
            membership('u1', 2027, {type: UserType.BENEFICIARIO, level: UserLevel.SCOUT, setId: 's2'})
        ];

        const in2026 = usersForYear(users, memberships, 2026);
        expect(in2026[0].setId).toBe('s1');
        expect(in2026[0].level).toBe(UserLevel.JEFE);

        const in2027 = usersForYear(users, memberships, 2027);
        expect(in2027[0].type).toBe(UserType.BENEFICIARIO);
        expect(in2027[0].level).toBe(UserLevel.SCOUT);
        expect(in2027[0].setId).toBe('s2');
    });

    it('conserva el usuario original si no tiene membresía en ese año', () => {
        const result = usersForYear(users, [membership('u1', 2026)], 2027);
        expect(result[1].type).toBe(UserType.BENEFICIARIO);
        expect(result[1].setId).toBeNull();
    });

    it('no muta los usuarios originales', () => {
        usersForYear(users, [membership('u1', 2026, {setId: 's9'})], 2026);
        expect(users[0].setId).toBeNull();
    });
});
