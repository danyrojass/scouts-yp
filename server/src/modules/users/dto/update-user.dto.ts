import { IsOptional, IsString, MinLength, IsEnum, IsBoolean } from 'class-validator';
import { UserType, UserLevel, Role } from '@prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;

  @IsOptional()
  @IsString()
  groupId?: string | null;

  @IsOptional()
  @IsString()
  setId?: string | null;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
