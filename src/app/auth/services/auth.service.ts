import {inject, Injectable, signal} from '@angular/core';
import {Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from '@angular/fire/auth';
import {doc, docData, Firestore, setDoc} from '@angular/fire/firestore';
import {from, of, switchMap} from 'rxjs';
import {map} from 'rxjs/operators';
import {User, UserLevel, UserType} from '../../users/models';
import {NavigationService} from '../../shared/services/navigation.service';
import {firestoreToUser, userToFirestore} from '../../shared/utils/firestore.utils';

@Injectable({providedIn: 'root'})
export class AuthService {

    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(NavigationService);
    private _user = signal<User | null>(null);
    readonly user = this._user.asReadonly();
    readonly user$ = authState(this.auth).pipe(
        switchMap(firebaseUser => {
            if (!firebaseUser) {
                this._user.set(null);
                return of(null);
            }

            const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);

            return docData(userRef).pipe(
                map((data: any) => {
                    const user = firestoreToUser(data);
                    const defaults: Partial<User> = {
                        name: '',
                        type: UserType.BENEFICIARIO,
                        level: UserLevel.LOBATO,
                        groupId: null,
                        setId: null,
                        createdAt: new Date()
                    };

                    return {
                        ...defaults,
                        ...user,
                        id: firebaseUser.uid,
                        email: firebaseUser.email ?? '',
                    } as User;
                })
            );
        })
    );

    constructor() {
        this.user$.subscribe(user => {
            this._user.set(user);
        });
    }

    login(email: string, password: string) {
        return from(signInWithEmailAndPassword(this.auth, email, password));
    }

    register(email: string, password: string, userData: Partial<User>) {
        return from(
            createUserWithEmailAndPassword(this.auth, email, password).then(result => {
                const user: User = {
                    id: result.user.uid,
                    email,
                    name: userData.name ?? '',
                    dateOfBirth: userData.dateOfBirth ?? null,
                    type: userData.type ?? UserType.BENEFICIARIO,
                    level: userData.level ?? UserLevel.LOBATO,
                    groupId: userData.groupId ?? null,
                    setId: userData.setId ?? null,
                    createdAt: new Date()
                };

                const userRef = doc(this.firestore, `users/${user.id}`);
                return setDoc(userRef, userToFirestore(user));
            })
        );
    }

    logout(): void {
        this._user.set(null);
        signOut(this.auth).then(() => {
            this.router.navigate(['/login']);
        }).catch(error => {
            console.error('Logout error:', error);
        });
    }
}