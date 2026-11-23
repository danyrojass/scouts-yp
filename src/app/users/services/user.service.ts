import {inject, Injectable} from '@angular/core';
import {
    collection,
    collectionData,
    deleteDoc,
    doc,
    docData,
    Firestore,
    orderBy,
    query,
    updateDoc,
    where
} from '@angular/fire/firestore';
import {addDoc} from 'firebase/firestore';
import {Observable} from 'rxjs';
import {map, take} from 'rxjs/operators';
import {User} from '../models';
import {firestoreToUser, userToFirestore} from '../../shared/utils/firestore.utils';
import {AuthService} from '../../auth/services/auth.service';

@Injectable({providedIn: 'root'})
export class UserService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    private mapUsers(data: any[]): User[] {
        return data.map(item => ({
            ...firestoreToUser(item),
            id: item.id
        })) as User[];
    }

    private mapUser(data: any): User {
        return {
            ...firestoreToUser(data),
            id: data.id
        } as User;
    }

    /** Siempre scoped al grupo del usuario autenticado (modo grupo único). */
    getUsers(groupId?: string): Observable<User[]> {
        const targetGroupId = groupId ?? this.authService.user()?.groupId;
        const usersRef = collection(this.firestore, 'users');
        const q = targetGroupId
            ? query(usersRef, where('group_id', '==', targetGroupId), orderBy('name', 'asc'))
            : query(usersRef, orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map(data => this.mapUsers(data)),
            take(1)
        );
    }

    getUsersByGroup(groupId: string): Observable<User[]> {
        return this.getUsers(groupId);
    }

    getUsersBySet(setId: string): Observable<User[]> {
        const usersRef = collection(this.firestore, 'users');
        const q = query(usersRef, where('set_id', '==', setId), orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map(data => this.mapUsers(data)),
            take(1)
        );
    }

    getUserById(id: string | null): Observable<User | undefined> {
        const userRef = doc(this.firestore, `users/${id}`);
        return docData(userRef, {idField: 'id'}).pipe(
            map(data => data ? this.mapUser(data) : undefined),
            take(1)
        );
    }

    createUser(user: Partial<User>) {
        const usersRef = collection(this.firestore, 'users');
        // Modo grupo único: el grupo siempre es el del dirigente autenticado.
        const groupId = this.authService.user()?.groupId ?? user.groupId;
        return addDoc(usersRef, userToFirestore({...user, groupId}));
    }

    updateUser(id: string, user: Partial<User>) {
        const userRef = doc(this.firestore, `users/${id}`);
        return updateDoc(userRef, userToFirestore(user));
    }

    deleteUser(id: string) {
        const userRef = doc(this.firestore, `users/${id}`);
        return deleteDoc(userRef);
    }
}
