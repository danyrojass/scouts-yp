export interface Group {
    id?: string;
    name: string;
    number: string;
    city: string;
    createdAt: Date;
    /** Año lectivo que muestra el dashboard. */
    activeYear?: number;
    /** Años con datos, para el selector del histórico. */
    years?: number[];
}