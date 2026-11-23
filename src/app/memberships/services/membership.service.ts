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
import {firstValueFrom, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Membership} from '../models/membership.model';
import {membershipToFirestore, firestoreToMembership} from '../../shared/utils/firestore.utils';
import {yearFor} from '../../shared/utils/year.util';
import {AuthService} from '../../auth/services/auth.service';
import {GroupService} from '../../groups/services/group.service';
import {User} from '../../users/models';

/** Pertenencias por año lectivo. Siempre scoped al grupo del usuario. */
@Injectable({providedIn: 'root'})
export class MembershipService {
    private firestore = inject(Firestore);
    private authService = inject(AuthService);
    private groupService = inject(GroupService);

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

    /**
     * Mantiene la membresía del año activo alineada con el formulario de usuario.
     * Si la persona ya tiene membresía ese año, actualiza rol/nivel/sección;
     * si no, la crea. No toma decisiones sobre el grupo: siempre es el del usuario.
     */
    async ensureMembership(user: User): Promise<void> {
        if (!user.id) return;
        const groupId = user.groupId ?? this.authService.user()?.groupId ?? null;
        if (!groupId) return;

        const group = await firstValueFrom(this.groupService.getGroupById(groupId));
        const year = yearFor(group?.activeYear);
        const existing = await firstValueFrom(this.getMemberships(groupId, year));
        const current = existing.find(m => m.userId === user.id);

        if (current?.id) {
            await this.updateMembership(current.id, {
                type: user.type,
                level: user.level,
                setId: user.setId ?? null,
                active: true
            });
            return;
        }

        await this.createMembership({
            userId: user.id,
            groupId,
            year,
            type: user.type,
            level: user.level,
            setId: user.setId ?? null,
            active: true,
            createdAt: new Date()
        });
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
