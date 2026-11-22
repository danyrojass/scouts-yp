import { IsEnum, IsString } from 'class-validator';
import { UserLevel } from '@prisma/client';

export class CreateProgressionDto {
  @IsString()
  userId!: string;

  @IsEnum(UserLevel)
  toLevel!: UserLevel;
}
