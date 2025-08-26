import {inject, Injectable} from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  updateDoc
} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {Group} from '../models';

@Injectable({providedIn: 'root'})
export class GroupService {
  private firestore = inject(Firestore);

  getGroups(): Observable<Group[]> {
    const groupsRef = collection(this.firestore, 'groups');
    return collectionData(groupsRef, {idField: 'id'}) as Observable<Group[]>;
  }

  getGroupById(id: string | null): Observable<Group> {
    const groupRef = doc(this.firestore, `groups/${id}`);
    return docData(groupRef, {idField: 'id'}) as Observable<Group>;
  }

  createGroup(group: Group) {
    const groupsRef = collection(this.firestore, 'groups');
    return addDoc(groupsRef, group);
  }

  updateGroup(id: string, group: Partial<Group>) {
    const groupRef = doc(this.firestore, `groups/${id}`);
    return updateDoc(groupRef, group);
  }

  deleteGroup(id: string | null) {
    const groupRef = doc(this.firestore, `groups/${id}`);
    return deleteDoc(groupRef);
  }
}
