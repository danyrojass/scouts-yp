import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SetType } from '@prisma/client';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QuerySetsDto extends PaginationDto {
  @IsOptional()
  @IsEnum(SetType)
  type?: SetType;

  @IsOptional()
  @IsString()
  groupId?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
