import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { SetType } from '@prisma/client';

export class UpdateSetDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(SetType)
  type?: SetType;

  @IsOptional()
  @IsString()
  @MinLength(1)
  groupId?: string;
}
