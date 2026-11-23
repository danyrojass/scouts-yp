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
    where,
    writeBatch
} from '@angular/fire/firestore';
import {firstValueFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Activity, ActivityCompletion} from '../models';
import {activityToFirestore, firestoreToActivity, firestoreToActivityCompletion} from '../../shared/utils/firestore.utils';
import {yearFor} from '../../shared/utils/year.util';
import {YearService} from '../../shared/services/year.service';

/** Cambios de puntos (y fecha) sobre completaciones ya existentes. */
export interface CompletionUpdate {
    id: string;
    earnedPoints: number;
    completedAt?: Date;
}

@Injectable({providedIn: 'root'})
export class ActivityService {
    private firestore = inject(Firestore);
    private yearService = inject(YearService);

    /** Sin año explícito se usa el año lectivo activo. */
    private targetYear(year?: number): number {
        return year === undefined || year === null
            ? this.yearService.activeYear()
            : yearFor(year);
    }

    /**
     * Filtramos en memoria para que los documentos históricos sin `year`
     * (que el mapper interpreta como DEFAULT_YEAR) sigan apareciendo sin
     * necesidad de un backfill previo ni índices compuestos.
     */
    private inYear<T extends {year?: number}>(items: T[], year: number): T[] {
        return items.filter(item => yearFor(item.year) === year);
    }

    getActivities(year?: number): Observable<Activity[]> {
        const activitiesRef = collection(this.firestore, 'activities');
        const q = query(activitiesRef, orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => this.inYear(data.map(item => ({
                ...firestoreToActivity(item), id: item.id
            })) as Activity[], this.targetYear(year)))
        );
    }

    getActivitiesByLevel(level: string, year?: number): Observable<Activity[]> {
        const activitiesRef = collection(this.firestore, 'activities');
        const q = query(activitiesRef, where('level', '==', level), orderBy('name', 'asc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => this.inYear(data.map(item => ({
                ...firestoreToActivity(item), id: item.id
            })) as Activity[], this.targetYear(year)))
        );
    }

    getActivityById(id: string): Observable<Activity | undefined> {
        const activityRef = doc(this.firestore, `activities/${id}`);
        return docData(activityRef, {idField: 'id'}).pipe(
            map((data: any) => data ? {...firestoreToActivity(data), id: data.id} : undefined)
        );
    }

    createActivity(activity: Activity) {
        const activitiesRef = collection(this.firestore, 'activities');
        return addDoc(activitiesRef, {
            ...activityToFirestore(activity),
            year: activity.year ?? this.yearService.activeYear()
        });
    }

    updateActivity(id: string, activity: Partial<Activity>) {
        const activityRef = doc(this.firestore, `activities/${id}`);
        return updateDoc(activityRef, activityToFirestore(activity));
    }

    getActivityCompletions(setId: string, year?: number): Observable<ActivityCompletion[]> {
        const completionsRef = collection(this.firestore, 'activity-completion');
        const q = query(
            completionsRef,
            where('set_id', '==', setId),
            orderBy('completed_at', 'desc')
        );
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => this.inYear(data.map(item => ({
                ...firestoreToActivityCompletion(item), id: item.id
            })) as ActivityCompletion[], this.targetYear(year)))
        );
    }

    async getActivityCompletionsByActivityId(activityId: string, year?: number): Promise<ActivityCompletion[]> {
        const completionsRef = collection(this.firestore, 'activity-completion');
        const q = query(completionsRef, where('activity_id', '==', activityId));
        const data = await firstValueFrom(collectionData(q, {idField: 'id'}));
        return this.inYear(data.map((item: any) => ({
            ...firestoreToActivityCompletion(item), id: item.id
        })) as ActivityCompletion[], this.targetYear(year));
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
            earned_points: completion.earnedPoints,
            year: completion.year ?? this.yearService.activeYear()
        });
    }

    /** Escribe altas, modificaciones y bajas en un único batch atómico. */
    async saveCompletions(
        toCreate: ActivityCompletion[],
        toDelete: string[] = [],
        toUpdate: CompletionUpdate[] = []
    ): Promise<void> {
        if (toCreate.length === 0 && toDelete.length === 0 && toUpdate.length === 0) return;

        const batch = writeBatch(this.firestore);
        const completionsRef = collection(this.firestore, 'activity-completion');

        for (const completion of toCreate) {
            batch.set(doc(completionsRef), {
                activity_id: completion.activityId,
                set_id: completion.setId,
                user_id: completion.userId,
                completed_at: completion.completedAt instanceof Date
                    ? completion.completedAt
                    : new Date(completion.completedAt),
                earned_points: completion.earnedPoints,
                year: completion.year ?? this.yearService.activeYear()
            });
        }

        for (const update of toUpdate) {
            batch.update(doc(this.firestore, `activity-completion/${update.id}`), {
                earned_points: update.earnedPoints,
                ...(update.completedAt ? {completed_at: update.completedAt} : {})
            });
        }

        for (const id of toDelete) {
            batch.delete(doc(this.firestore, `activity-completion/${id}`));
        }

        await batch.commit();
    }

    getCompletionsBySetIds(setIds: string[], year?: number): Observable<ActivityCompletion[]> {
        if (setIds.length === 0) return new Observable(obs => { obs.next([]); obs.complete(); });
        const completionsRef = collection(this.firestore, 'activity-completion');
        const q = query(completionsRef, where('set_id', 'in', setIds), orderBy('completed_at', 'desc'));
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => this.inYear(data.map(item => ({
                ...firestoreToActivityCompletion(item), id: item.id
            })) as ActivityCompletion[], this.targetYear(year)))
        );
    }
}
