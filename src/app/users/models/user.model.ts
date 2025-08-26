import {UserType} from './user-type.enum';
import {UserLevel} from './user-level.enum';

export interface User {
  id: string;
  name: string;
  email: string;
  dateOfBirth: Date | null;
  type: UserType;
  level: UserLevel;
  groupId: string | null;
  setId: string | null;
  createdAt: Date;
}
