import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { UserLevel } from '@prisma/client';

export class UpdateSetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;
}
