import {ComponentFixture, TestBed} from '@angular/core/testing';
import {NavbarComponent} from './navbar.component';
import {AuthService} from '../../../auth/services/auth.service';
import {createMockAuth} from '../../../testing/mocks/firebase.mocks';
import {provideRouter} from '@angular/router';

describe('NavbarComponent', () => {
    let component: NavbarComponent;
    let fixture: ComponentFixture<NavbarComponent>;
    let mockAuth: any;

    beforeEach(async () => {
        mockAuth = createMockAuth();

        await TestBed.configureTestingModule({
            imports: [NavbarComponent],
            providers: [
                {provide: AuthService, useValue: mockAuth},
                provideRouter([])
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(NavbarComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle menu', () => {
        expect(component.isMenuOpen()).toBeFalse();
        component.toggleMenu();
        expect(component.isMenuOpen()).toBeTrue();
        component.toggleMenu();
        expect(component.isMenuOpen()).toBeFalse();
    });

    it('should call logout on onLogout', () => {
        component.onLogout();
        expect(mockAuth.signOut).toHaveBeenCalled();
    });

    it('should close menu on logout', () => {
        component.isMenuOpen.set(true);
        component.onLogout();
        expect(component.isMenuOpen()).toBeFalse();
    });
});
