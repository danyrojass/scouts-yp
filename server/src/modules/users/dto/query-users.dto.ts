import { IsOptional, IsString, IsEnum } from 'class-validator';
import { UserType, UserLevel } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryUsersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserType)
  type?: UserType;

  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  setId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
