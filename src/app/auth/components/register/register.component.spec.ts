import {ComponentFixture, TestBed} from '@angular/core/testing';
import {RegisterComponent} from './register.component';
import {AuthService} from '../../services/auth.service';
import {GroupService} from '../../../groups/services/group.service';
import {NavigationService} from '../../../shared/services/navigation.service';
import {createMockAuth, createMockFirestore} from '../../../testing/mocks/firebase.mocks';
import {provideRouter} from '@angular/router';
import {of} from 'rxjs';

describe('RegisterComponent', () => {
    let component: RegisterComponent;
    let fixture: ComponentFixture<RegisterComponent>;
    let mockAuth: any;
    let mockGroupService: any;
    let mockRouter: any;

    beforeEach(async () => {
        mockAuth = createMockAuth();
        mockGroupService = {
            getGroups: jasmine.createSpy().and.returnValue(of([])),
            createGroup: jasmine.createSpy().and.returnValue(Promise.resolve({id: 'new-group-id'}))
        };
        mockRouter = {
            navigate: jasmine.createSpy().and.returnValue(Promise.resolve())
        };

        await TestBed.configureTestingModule({
            imports: [RegisterComponent],
            providers: [
                {provide: AuthService, useValue: mockAuth},
                {provide: GroupService, useValue: mockGroupService},
                {provide: NavigationService, useValue: mockRouter},
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(RegisterComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.registerForm.invalid).toBeTrue();
    });

    it('should have valid form with correct values', () => {
        component.registerForm.patchValue({
            name: 'Test User',
            email: 'test@test.com',
            password: '123456',
            dateOfBirth: '2000-01-01',
            type: 'Beneficiario' as any,
            level: 'Lobato' as any
        });
        expect(component.registerForm.valid).toBeTrue();
    });

    it('should not submit invalid form', () => {
        component.onSubmit();
        expect(mockAuth.createUserWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should load groups on init', () => {
        expect(mockGroupService.getGroups).toHaveBeenCalled();
    });

    it('should have user levels defined', () => {
        expect(component.userLevels().length).toBeGreaterThan(0);
    });

    it('should have user types defined', () => {
        expect(component.userTypes().length).toBeGreaterThan(0);
    });
});