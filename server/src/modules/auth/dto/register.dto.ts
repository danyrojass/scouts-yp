import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserType, UserLevel } from '@prisma/client';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  organizationName?: string;

  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;
}
