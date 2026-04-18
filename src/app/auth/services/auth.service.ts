import {inject, Injectable, signal} from '@angular/core';
import {Auth, authState, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut} from '@angular/fire/auth';
import {doc, docData, Firestore, setDoc, updateDoc} from '@angular/fire/firestore';
import {from, of} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';
import {User, UserLevel, UserType} from '../../users/models';
import {NavigationService} from '../../shared/services/navigation.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(NavigationService);

  private _user = signal<User | null>(null);
  user = this._user.asReadonly();

  constructor() {
    authState(this.auth).pipe(
      switchMap(firebaseUser => {
        if (firebaseUser) {
          const userRef = doc(this.firestore, `users/${firebaseUser.uid}`);
          return docData(userRef).pipe(
            map((user: any) => user ? {
              ...user,
              id: firebaseUser.uid,
              email: firebaseUser.email || ''
            } as User : null)
          );
        }
        return of(null);
      })
    ).subscribe(this._user.set);
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

        const userRef = doc(this.firestore, `users/${result.user.uid}`);
        return setDoc(userRef, user);
      })
    );
  }

  login(email: string, password: string) {
    return from(signInWithEmailAndPassword(this.auth, email, password));
  }

  logout() {
    return from(signOut(this.auth)).pipe(
      map(() => this.router.navigate(['/login']))
    );
  }

  isAuthenticated() {
    return authState(this.auth).pipe(map(user => !!user));
  }

  getCurrentUser() {
    return this._user();
  }

  updateProfile(userData: Partial<User>) {
    const user = this._user();
    if (!user) throw new Error('El usuario no se encuentra autenticado');
    const userRef = doc(this.firestore, `users/${user.id}`);
    return from(updateDoc(userRef, userData as any));
  }
}
