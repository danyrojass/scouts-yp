export interface Activity {
  id?: string;
  name: string;
  key: string;
  level: 'Lobato' | 'Scout' | 'Hiker' | 'Rover' | 'Director';
  points: number;
  createdAt: Date;
}