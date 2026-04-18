import {inject, Injectable} from '@angular/core';
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
import {Observable} from 'rxjs';
import {Activity, ActivityCompletion} from '../models';

@Injectable({providedIn: 'root'})
export class ActivityService {
  private firestore = inject(Firestore);

  getActivities(): Observable<Activity[]> {
    const activitiesRef = collection(this.firestore, 'activities');
    const q = query(activitiesRef, orderBy('name', 'asc'));
    return collectionData(q, {idField: 'id'}) as Observable<Activity[]>;
  }

  getActivitiesByLevel(level: string): Observable<Activity[]> {
    const activitiesRef = collection(this.firestore, 'activities');
    const q = query(activitiesRef, where('level', '==', level), orderBy('name', 'asc'));
    return collectionData(q, {idField: 'id'}) as Observable<Activity[]>;
  }

  getActivityById(id: string): Observable<Activity> {
    const activityRef = doc(this.firestore, `activities/${id}`);
    return docData(activityRef, {idField: 'id'}) as Observable<Activity>;
  }

  createActivity(activity: Activity) {
    const activitiesRef = collection(this.firestore, 'activities');
    return addDoc(activitiesRef, activity);
  }

  updateActivity(id: string, activity: Partial<Activity>) {
    const activityRef = doc(this.firestore, `activities/${id}`);
    return updateDoc(activityRef, activity);
  }

  deleteActivity(id: string) {
    const activityRef = doc(this.firestore, `activities/${id}`);
    return deleteDoc(activityRef);
  }

  // Activity Completions
  getActivityCompletions(groupId: string): Observable<ActivityCompletion[]> {
    const completionsRef = collection(this.firestore, 'activityCompletions');
    const q = query(completionsRef, where('groupId', '==', groupId), orderBy('completedAt', 'desc'));
    return collectionData(q, {idField: 'id'}) as Observable<ActivityCompletion[]>;
  }

  getUserActivityCompletions(userId: string): Observable<ActivityCompletion[]> {
    const completionsRef = collection(this.firestore, 'activityCompletions');
    const q = query(completionsRef, where('userId', '==', userId), orderBy('completedAt', 'desc'));
    return collectionData(q, {idField: 'id'}) as Observable<ActivityCompletion[]>;
  }

  recordActivityCompletion(completion: ActivityCompletion) {
    const completionsRef = collection(this.firestore, 'activityCompletions');
    return addDoc(completionsRef, completion);
  }

  deleteActivityCompletion(id: string) {
    const completionRef = doc(this.firestore, `activityCompletions/${id}`);
    return deleteDoc(completionRef);
  }
}
