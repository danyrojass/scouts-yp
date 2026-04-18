import {UserLevel} from "../../users/models";

export interface Activity {
    id?: string;
    name: string;
    key: string;
    level: UserLevel;
    points: number;
    createdAt: Date;
}