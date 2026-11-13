import { IsEnum, IsIn, IsOptional, IsString } from 'class-validator';
import { UserLevel } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QuerySetsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(UserLevel)
  level?: UserLevel;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'name', 'level'])
  sortBy?: string;
}
