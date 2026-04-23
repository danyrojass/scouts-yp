import {TestBed} from '@angular/core/testing';
import {AuthService} from './auth.service';
import {createMockAuth, createMockFirestore} from '../../testing/mocks/firebase.mocks';
import {Auth} from '@angular/fire/auth';
import {Firestore} from '@angular/fire/firestore';
import {NavigationService} from '../../shared/services/navigation.service';

describe('AuthService', () => {
    let service: AuthService;
    let mockAuth: any;
    let mockFirestore: any;
    let mockNavigation: any;

    beforeEach(() => {
        mockAuth = createMockAuth();
        mockFirestore = createMockFirestore();
        mockNavigation = {
            navigate: jasmine.createSpy().and.returnValue(Promise.resolve())
        };

        TestBed.configureTestingModule({
            providers: [
                AuthService,
                {provide: Auth, useValue: mockAuth},
                {provide: Firestore, useValue: mockFirestore},
                {provide: NavigationService, useValue: mockNavigation}
            ]
        });

        service = TestBed.inject(AuthService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should have initial null user', () => {
        expect(service.user()).toBeNull();
    });

    describe('login', () => {
        it('should call signInWithEmailAndPassword', async () => {
            await service.login('test@test.com', 'password123');
            expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@test.com', 'password123');
        });
    });

    describe('logout', () => {
        it('should sign out and navigate to login', (done) => {
            service.logout();
            setTimeout(() => {
                expect(mockAuth.signOut).toHaveBeenCalled();
                expect(mockNavigation.navigate).toHaveBeenCalledWith(['/login']);
                done();
            }, 100);
        });

        it('should set user to null after logout', (done) => {
            service.logout();
            setTimeout(() => {
                expect(service.user()).toBeNull();
                done();
            }, 100);
        });
    });
});
