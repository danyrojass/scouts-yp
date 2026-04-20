import {ComponentFixture, TestBed} from '@angular/core/testing';
import {LoginComponent} from './login.component';
import {AuthService} from '../../services/auth.service';
import {NavigationService} from '../../../shared/services/navigation.service';
import {createMockAuth} from '../../../testing/mocks/firebase.mocks';
import {provideRouter} from '@angular/router';

describe('LoginComponent', () => {
    let component: LoginComponent;
    let fixture: ComponentFixture<LoginComponent>;
    let mockAuth: any;
    let mockRouter: any;

    beforeEach(async () => {
        mockAuth = createMockAuth();
        mockRouter = {
            navigate: jasmine.createSpy().and.returnValue(Promise.resolve())
        };

        await TestBed.configureTestingModule({
            imports: [LoginComponent],
            providers: [
                {provide: AuthService, useValue: mockAuth},
                {provide: NavigationService, useValue: mockRouter},
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(LoginComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should have invalid form when empty', () => {
        expect(component.loginForm.invalid).toBeTrue();
    });

    it('should have invalid form with invalid email', () => {
        component.loginForm.patchValue({email: 'invalid', password: '123456'});
        expect(component.loginForm.invalid).toBeTrue();
    });

    it('should have valid form with correct values', () => {
        component.loginForm.patchValue({email: 'test@test.com', password: '123456'});
        expect(component.loginForm.valid).toBeTrue();
    });

    it('should not submit invalid form', () => {
        component.onSubmit();
        expect(mockAuth.signInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('should submit valid form', () => {
        component.loginForm.patchValue({email: 'test@test.com', password: '123456'});
        component.onSubmit();
        expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith('test@test.com', '123456');
    });

    it('should clear error on dismissError', () => {
        component.errorMessage.set('Some error');
        component.dismissError();
        expect(component.errorMessage()).toBe('');
    });
});