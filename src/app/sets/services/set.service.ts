import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  collectionData,
  deleteDoc,
  doc,
  docData,
  Firestore,
  query,
  where,
  orderBy,
  updateDoc
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Set } from '../models';

@Injectable({ providedIn: 'root' })
export class SetService {
  private firestore = inject(Firestore);

  getSets(): Observable<Set[]> {
    const setsRef = collection(this.firestore, 'sets');
    return collectionData(setsRef, { idField: 'id' }) as Observable<Set[]>;
  }

  getSetsByGroup(groupId: string): Observable<Set[]> {
    const setsRef = collection(this.firestore, 'sets');
    const q = query(setsRef, where('groupId', '==', groupId), orderBy('name', 'asc'));
    return collectionData(q, { idField: 'id' }) as Observable<Set[]>;
  }

  getSetById(id: string | null): Observable<Set> {
    const setRef = doc(this.firestore, `sets/${id}`);
    return docData(setRef, { idField: 'id' }) as Observable<Set>;
  }

  createSet(set: Set) {
    const setsRef = collection(this.firestore, 'sets');
    return addDoc(setsRef, set);
  }

  updateSet(id: string, set: Partial<Set>) {
    const setRef = doc(this.firestore, `sets/${id}`);
    return updateDoc(setRef, set);
  }

  deleteSet(id: string) {
    const setRef = doc(this.firestore, `sets/${id}`);
    return deleteDoc(setRef);
  }
}
