import { IsEnum, IsString, MinLength } from 'class-validator';
import { SetType } from '@prisma/client';

export class CreateSetDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEnum(SetType)
  type!: SetType;

  @IsString()
  @MinLength(1)
  groupId!: string;
}
