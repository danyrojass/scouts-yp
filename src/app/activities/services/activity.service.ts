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
import {Activity, ActivityCompletion} from '../models';
import {activityToFirestore, firestoreToActivity, firestoreToActivityCompletion} from '../../shared/utils/firestore.utils';

@Injectable({providedIn: 'root'})
export class ActivityService {
    private firestore = inject(Firestore);

    getActivities(): Observable<Activity[]> {
        const activitiesRef = collection(this.firestore, 'activities');
        const q = query(activitiesRef, orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({...firestoreToActivity(item), id: item.id})))
        ) as Observable<Activity[]>;
    }

    getActivitiesByLevel(level: string): Observable<Activity[]> {
        const activitiesRef = collection(this.firestore, 'activities');
        const q = query(activitiesRef, where('level', '==', level), orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({...firestoreToActivity(item), id: item.id})))
        ) as Observable<Activity[]>;
    }

    getActivityById(id: string): Observable<Activity | undefined> {
        const activityRef = doc(this.firestore, `activities/${id}`);
        return docData(activityRef, {idField: 'id'}).pipe(
            map((data: any) => data ? {...firestoreToActivity(data), id: data.id} : undefined)
        );
    }

    createActivity(activity: Activity) {
        const activitiesRef = collection(this.firestore, 'activities');
        return addDoc(activitiesRef, activityToFirestore(activity));
    }

    updateActivity(id: string, activity: Partial<Activity>) {
        const activityRef = doc(this.firestore, `activities/${id}`);
        return updateDoc(activityRef, activityToFirestore(activity));
    }

    deleteActivity(id: string) {
        const activityRef = doc(this.firestore, `activities/${id}`);
        return deleteDoc(activityRef);
    }

    getActivityCompletions(groupId: string): Observable<ActivityCompletion[]> {
        const completionsRef = collection(this.firestore, 'activityCompletions');
        const q = query(completionsRef, where('group_id', '==', groupId), orderBy('completed_at', 'desc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({...firestoreToActivityCompletion(item), id: item.id})))
        ) as Observable<ActivityCompletion[]>;
    }
}
