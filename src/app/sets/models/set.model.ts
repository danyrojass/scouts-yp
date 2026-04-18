import {SetType} from './set-type.enum';

export interface Set {
  id?: string;
  name: string;
  type: SetType;
  groupId: string;
  createdAt: Date;
}
