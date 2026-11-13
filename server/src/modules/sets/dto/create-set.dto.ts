import { IsEnum, IsString, MinLength } from 'class-validator';
import { UserLevel } from '@prisma/client';

export class CreateSetDto {
  @IsString()
  @MinLength(2)
  name!: string;

  /** Rama de la sección. No se admite JEFE: los dirigentes no tienen sección. */
  @IsEnum(UserLevel)
  level!: UserLevel;
}
