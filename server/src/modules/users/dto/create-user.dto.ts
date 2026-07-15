import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserType, UserLevel, Role } from '@prisma/client';

export class CreateUserDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

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
  groupId?: string;

  @IsOptional()
  @IsString()
  setId?: string;
}
