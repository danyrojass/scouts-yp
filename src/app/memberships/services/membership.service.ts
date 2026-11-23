import {inject, Injectable} from '@angular/core';
import {
    addDoc,
    collection,
    collectionData,
    Firestore,
    query,
    updateDoc,
    where,
    doc,
    writeBatch
} from '@angular/fire/firestore';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Membership} from '../models/membership.model';
import {membershipToFirestore, firestoreToMembership} from '../../shared/utils/firestore.utils';
import {yearFor} from '../../shared/utils/year.util';
import {AuthService} from '../../auth/services/auth.service';

/** Pertenencias por año lectivo. Siempre scoped al grupo del usuario. */
@Injectable({providedIn: 'root'})
export class MembershipService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);

    getMemberships(groupId?: string, year?: number): Observable<Membership[]> {
        const targetGroupId = groupId ?? this.authService.user()?.groupId;
        const targetYear = yearFor(year);
        const membershipsRef = collection(this.firestore, 'memberships');
        const q = targetGroupId
            ? query(membershipsRef, where('group_id', '==', targetGroupId), where('year', '==', targetYear))
            : query(membershipsRef, where('year', '==', targetYear));

        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({
                ...firestoreToMembership(item),
                id: item.id
            })) as Membership[])
        );
    }

    /** Todas las pertenencias del grupo, sin filtrar por año (para el histórico). */
    getAllMemberships(groupId?: string): Observable<Membership[]> {
        const targetGroupId = groupId ?? this.authService.user()?.groupId;
        const membershipsRef = collection(this.firestore, 'memberships');
        const q = targetGroupId
            ? query(membershipsRef, where('group_id', '==', targetGroupId))
            : query(membershipsRef);
        return collectionData(q, {idField: 'id'}).pipe(
            map((data: any[]) => data.map(item => ({
                ...firestoreToMembership(item),
                id: item.id
            })) as Membership[])
        );
    }

    createMembership(membership: Membership) {
        return addDoc(collection(this.firestore, 'memberships'), membershipToFirestore(membership));
    }

    async createMemberships(memberships: Membership[]): Promise<void> {
        if (memberships.length === 0) return;
        const batch = writeBatch(this.firestore);
        const ref = collection(this.firestore, 'memberships');
        for (const membership of memberships) {
            batch.set(doc(ref), membershipToFirestore(membership));
        }
        await batch.commit();
    }

    updateMembership(id: string, patch: Partial<Membership>) {
        const data: Record<string, any> = {};
        if (patch.type !== undefined) data['type'] = patch.type;
        if (patch.level !== undefined) data['level'] = patch.level;
        if (patch.setId !== undefined) data['set_id'] = patch.setId;
        if (patch.active !== undefined) data['active'] = patch.active;
        return updateDoc(doc(this.firestore, `memberships/${id}`), data);
    }
}
