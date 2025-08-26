import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  docData,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { User } from '../models';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);

  getUsers(): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  getUsersByGroup(groupId: string): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('groupId', '==', groupId), orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  getUsersBySet(setId: string): Observable<User[]> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('setId', '==', setId), orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<User[]>;
  }

  getUserById(id: string | null): Observable<User> {
    const userRef = doc(this.firestore, `users/${id}`);
    return docData(userRef, { idField: 'id' }) as Observable<User>;
  }

  updateUser(id: string, user: Partial<User>) {
    const userRef = doc(this.firestore, `users/${id}`);
    return updateDoc(userRef, user);
  }

  deleteUser(id: string) {
    const userRef = doc(this.firestore, `users/${id}`);
    return deleteDoc(userRef);
  }
}
