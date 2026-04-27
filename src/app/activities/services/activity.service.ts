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
import {firstValueFrom, Observable} from 'rxjs';
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

    getActivityCompletions(setId: string): Observable<ActivityCompletion[]> {
        const completionsRef = collection(this.firestore, 'activity-completion');
        const q = query(completionsRef, where('set_id', '==', setId), orderBy('completed_at', 'desc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({...firestoreToActivityCompletion(item), id: item.id})))
        ) as Observable<ActivityCompletion[]>;
    }

    private async getActivityCompletionsByActivityId(activityId: string): Promise<ActivityCompletion[]> {
        const completionsRef = collection(this.firestore, 'activity-completion');
        const q = query(completionsRef, where('activity_id', '==', activityId));
        const data = await firstValueFrom(collectionData(q, {idField: 'id'}));
        return data.map((item: any) => ({...firestoreToActivityCompletion(item), id: item.id})) as ActivityCompletion[];
    }

    async deleteActivity(id: string) {
        const activityRef = doc(this.firestore, `activities/${id}`);
        
        const completions = await this.getActivityCompletionsByActivityId(id);
        const deletePromises = completions.map(completion => 
            deleteDoc(doc(this.firestore, `activity-completion/${completion.id}`))
        );
        
        await Promise.all([deleteDoc(activityRef), ...deletePromises]);
    }

    createCompletion(completion: ActivityCompletion) {
        const completionsRef = collection(this.firestore, 'activity-completion');
        return addDoc(completionsRef, {
            activity_id: completion.activityId,
            set_id: completion.setId,
            user_id: completion.userId,
            completed_at: completion.completedAt instanceof Date ? completion.completedAt : new Date(completion.completedAt),
            earned_points: completion.earnedPoints
        });
    }
}
