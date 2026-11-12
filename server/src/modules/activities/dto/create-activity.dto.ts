import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';
import { UserLevel } from '@prisma/client';

export class CreateActivityDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(2)
  key!: string;

  @IsEnum(UserLevel)
  level!: UserLevel;

  @IsInt()
  @Min(0)
  points!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
