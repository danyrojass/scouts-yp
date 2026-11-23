import {inject, Injectable, signal} from '@angular/core';
import {firstValueFrom} from 'rxjs';
import {filter, take} from 'rxjs/operators';

import {AuthService} from '../../auth/services/auth.service';
import {GroupService} from '../../groups/services/group.service';
import {MembershipService} from '../../memberships/services/membership.service';
import {UserService} from '../../users/services/user.service';
import {Membership} from '../../memberships/models/membership.model';
import {UserLevel, UserType} from '../../users/models';
import {DEFAULT_YEAR, yearFor} from '../utils/year.util';

/**
 * Año lectivo activo y años con datos. La fuente de verdad es el documento del
 * grupo; se carga al entrar y se actualiza al abrir un año nuevo.
 */
@Injectable({providedIn: 'root'})
export class YearService {
    private authService = inject(AuthService);
    private groupService = inject(GroupService);
    private membershipService = inject(MembershipService);
    private userService = inject(UserService);

    private _activeYear = signal(DEFAULT_YEAR);
    readonly activeYear = this._activeYear.asReadonly();

    private _years = signal<number[]>([DEFAULT_YEAR]);
    readonly years = this._years.asReadonly();

    private loadedGroupId: string | null = null;

    constructor() {
        this.authService.user$.subscribe(user => {
            const groupId = user?.groupId ?? null;
            if (!groupId || this.loadedGroupId === groupId) return;
            this.loadedGroupId = groupId;
            this.load(groupId);
        });
    }

    private async load(groupId: string): Promise<void> {
        try {
            const group = await firstValueFrom(this.groupService.getGroupById(groupId));
            if (!group) return;
            this._activeYear.set(yearFor(group.activeYear));
            this._years.set(group.years?.length ? group.years : [yearFor(group.activeYear)]);
        } catch (error) {
            console.error('Error al cargar el año lectivo:', error);
        }
    }

    /** Copia las pertenencias activas al año siguiente y lo deja como activo. */
    async openNextYear(): Promise<number> {
        const user = await firstValueFrom(
            this.authService.user$.pipe(filter((u): u is NonNullable<typeof u> => !!u), take(1))
        );
        if (!user.groupId) throw new Error('El usuario no tiene un grupo asignado');

        const nextYear = this.activeYear() + 1;
        if (this.years().includes(nextYear)) {
            this._activeYear.set(nextYear);
            return nextYear;
        }

        const [currentMemberships, users] = await Promise.all([
            firstValueFrom(this.membershipService.getMemberships(user.groupId, this.activeYear())),
            firstValueFrom(this.userService.getUsersByGroup(user.groupId))
        ]);

        const source: Membership[] = currentMemberships.length > 0
            ? currentMemberships
            : users.map(u => ({
                userId: u.id ?? '',
                groupId: user.groupId!,
                year: this.activeYear(),
                type: u.type ?? UserType.BENEFICIARIO,
                level: u.level ?? UserLevel.LOBATO,
                setId: u.setId ?? null,
                active: true,
                createdAt: new Date()
            }));

        await this.membershipService.createMemberships(source
            .filter(m => m.active !== false)
            .map(m => ({
                ...m,
                id: undefined,
                year: nextYear,
                active: true,
                createdAt: new Date()
            })));

        const years = [...this.years(), nextYear].sort((a, b) => a - b);
        await this.groupService.setActiveYear(user.groupId, nextYear, years);
        this._years.set(years);
        this._activeYear.set(nextYear);
        return nextYear;
    }
}
