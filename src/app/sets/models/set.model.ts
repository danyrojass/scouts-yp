import {UserLevel} from '../../users/models';

export interface Set {
    id?: string;
    name: string;
    /**
     * Rama de la sección (valores guardados Lobato/Scout/Caminante/Rover). En la UI
     * se muestra como Manada/Tropa/Comunidad/Clan; la unidad chica se deriva con
     * unitNameForLevel: Seisena/Patrulla/Equipo/Clan.
     */
    level: UserLevel;
    groupId: string;
    createdAt: Date;
    /** False cuando la sección se da de baja; sus datos históricos se conservan. */
    active?: boolean;
}
