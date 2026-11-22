import {inject, Injectable} from '@angular/core';
import {
    addDoc,
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
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Set} from '../models';
import {firestoreToSet, setToFirestore} from '../../shared/utils/firestore.utils';
import {AuthService} from '../../auth/services/auth.service';

@Injectable({providedIn: 'root'})
export class SetService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    /** Siempre scoped al grupo del usuario autenticado (modo grupo único). */
    getSets(groupId?: string): Observable<Set[]> {
        const targetGroupId = groupId ?? this.authService.user()?.groupId;
        const setsRef = collection(this.firestore, 'sets');
        const q = targetGroupId
            ? query(setsRef, where('group_id', '==', targetGroupId), orderBy('name', 'asc'))
            : query(setsRef, orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({...firestoreToSet(item), id: item.id})))
        ) as Observable<Set[]>;
    }

    getSetsByGroup(groupId: string): Observable<Set[]> {
        return this.getSets(groupId);
    }

    getSetById(id: string | null): Observable<Set | undefined> {
        if (!id) {
            return new Observable(observer => {
                observer.next(undefined);
                observer.complete();
            });
        }
        const setRef = doc(this.firestore, `sets/${id}`);
        return docData(setRef, {idField: 'id'}).pipe(
            map((data: any) => data ? {...firestoreToSet(data), id: data.id} : undefined)
        );
    }

    createSet(set: Set) {
        const setsRef = collection(this.firestore, 'sets');
        return addDoc(setsRef, setToFirestore(set));
    }

    updateSet(id: string, set: Partial<Set>) {
        const setRef = doc(this.firestore, `sets/${id}`);
        return updateDoc(setRef, setToFirestore(set));
    }

    deleteSet(id: string) {
        const setRef = doc(this.firestore, `sets/${id}`);
        return deleteDoc(setRef);
    }
}
