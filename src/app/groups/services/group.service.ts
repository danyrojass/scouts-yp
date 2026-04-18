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
import {map} from 'rxjs/operators';
import {Group} from '../models';
import {firestoreToGroup, groupToFirestore} from '../../shared/utils/firestore.utils';

@Injectable({providedIn: 'root'})
export class GroupService {
    private firestore = inject(Firestore);

    getGroups(): Observable<Group[]> {
        const groupsRef = collection(this.firestore, 'groups');
        return collectionData(groupsRef, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({...firestoreToGroup(item), id: item.id})))
        ) as Observable<Group[]>;
    }

    getGroupById(id: string | null): Observable<Group | undefined> {
        if (!id) {
            return new Observable(observer => {
                observer.next(undefined);
                observer.complete();
            });
        }
        const groupRef = doc(this.firestore, `groups/${id}`);
        return docData(groupRef, {idField: 'id'}).pipe(
            map((data: any) => data ? {...firestoreToGroup(data), id: data.id} : undefined)
        );
    }

    createGroup(group: Group) {
        const groupsRef = collection(this.firestore, 'groups');
        return addDoc(groupsRef, groupToFirestore(group));
    }

    updateGroup(id: string, group: Partial<Group>) {
        const groupRef = doc(this.firestore, `groups/${id}`);
        return updateDoc(groupRef, groupToFirestore(group));
    }

    deleteGroup(id: string | null) {
        const groupRef = doc(this.firestore, `groups/${id}`);
        return deleteDoc(groupRef);
    }
}
