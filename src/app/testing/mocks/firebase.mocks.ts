/// <reference types="jasmine" />
import {signal} from '@angular/core';
import {of} from 'rxjs';

/**
 * Mock liviano de Firebase Auth que sirve tanto como token `Auth` de
 * @angular/fire (para `authState`) como de `AuthService` en los specs de
 * componentes. Las funciones modulares de firebase/firestore y firebase/auth
 * llaman a `getModularInstance(x)`, que devuelve el objeto directo cuando no
 * tiene `_delegate`, así que alcanza con exponer los mismos métodos.
 */
export function createMockAuth(): any {
    const authenticatedUser = {
        uid: 'test-user-id',
        email: 'test@test.com'
    };

    const auth: any = {
        signInWithEmailAndPassword: jasmine.createSpy('signInWithEmailAndPassword')
            .and.returnValue(Promise.resolve({user: authenticatedUser})),
        createUserWithEmailAndPassword: jasmine.createSpy('createUserWithEmailAndPassword')
            .and.returnValue(Promise.resolve({user: authenticatedUser})),
        signOut: jasmine.createSpy('signOut').and.returnValue(Promise.resolve()),
        onAuthStateChanged: jasmine.createSpy('onAuthStateChanged').and.callFake(
            (next: (user: any) => void) => {
                next(null);
                return () => {};
            }
        ),

        // Superficie de AuthService usada por los componentes.
        user: signal(null),
        user$: of(null),
        login: jasmine.createSpy('login').and.callFake((email: string, password: string) => {
            auth.signInWithEmailAndPassword(email, password);
            return of({user: authenticatedUser});
        }),
        register: jasmine.createSpy('register').and.callFake(
            (email: string, password: string, userData: any) => {
                auth.createUserWithEmailAndPassword(email, password, userData);
                return of({user: authenticatedUser});
            }
        ),
        logout: jasmine.createSpy('logout').and.callFake(() => auth.signOut())
    };

    return auth;
}

/** Firestore mock: AuthService sólo lo usa cuando hay un usuario autenticado. */
export function createMockFirestore(): any {
    return {};
}
