import {UserLevel} from '../../users/models';

export interface Set {
    id?: string;
    name: string;
    /**
     * Rama de la sección (Lobato/Scout/Caminante/Rover). Define el tipo de unidad:
     * Lobato → Seisena, Scout → Patrulla, Caminante → Equipo, Rover → Clan.
     */
    level: UserLevel;
    groupId: string;
    createdAt: Date;
}
