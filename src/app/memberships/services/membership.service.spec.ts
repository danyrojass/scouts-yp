import {TestBed} from '@angular/core/testing';
import {Firestore} from '@angular/fire/firestore';
import {of} from 'rxjs';

import {MembershipService} from './membership.service';
import {AuthService} from '../../auth/services/auth.service';
import {GroupService} from '../../groups/services/group.service';
import {User, UserLevel, UserType} from '../../users/models';

function testUser(overrides: Partial<User> = {}): User {
    return {
        id: 'u1',
        name: 'Daniel',
        email: 'daniel@test.com',
        dateOfBirth: null,
        type: UserType.DIRIGENTE,
        level: UserLevel.JEFE,
        groupId: null,
        setId: null,
        createdAt: new Date(),
        ...overrides
    };
}

describe('MembershipService.ensureMembership', () => {
    let service: MembershipService;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                MembershipService,
                {provide: Firestore, useValue: {}},
                {provide: AuthService, useValue: {user: () => ({groupId: 'g1'})}},
                {provide: GroupService, useValue: {getGroupById: () => of({activeYear: 2027})}}
            ]
        });
        service = TestBed.inject(MembershipService);
        spyOn(service, 'getMemberships').and.returnValue(of([]));
        spyOn(service, 'createMembership').and.returnValue(Promise.resolve({} as any));
        spyOn(service, 'updateMembership').and.returnValue(Promise.resolve() as any);
    });

    it('crea la membresía del año activo con el grupo del dirigente', async () => {
        await service.ensureMembership(testUser());

        expect(service.createMembership).toHaveBeenCalledWith(jasmine.objectContaining({
            userId: 'u1',
            groupId: 'g1',
            year: 2027,
            type: UserType.DIRIGENTE,
            level: UserLevel.JEFE,
            active: true
        }));
        expect(service.updateMembership).not.toHaveBeenCalled();
    });

    it('actualiza la membresía existente en vez de duplicarla', async () => {
        (service.getMemberships as jasmine.Spy).and.returnValue(of([{
            id: 'm1',
            userId: 'u1',
            groupId: 'g1',
            year: 2027,
            type: UserType.BENEFICIARIO,
            level: UserLevel.LOBATO,
            setId: null,
            active: true,
            createdAt: new Date()
        }]));

        await service.ensureMembership(testUser({setId: 's2'}));

        expect(service.updateMembership).toHaveBeenCalledWith('m1', jasmine.objectContaining({
            type: UserType.DIRIGENTE,
            level: UserLevel.JEFE,
            setId: 's2',
            active: true
        }));
        expect(service.createMembership).not.toHaveBeenCalled();
    });

    it('no hace nada sin id de usuario', async () => {
        await service.ensureMembership(testUser({id: undefined}));
        expect(service.createMembership).not.toHaveBeenCalled();
        expect(service.updateMembership).not.toHaveBeenCalled();
    });
});
