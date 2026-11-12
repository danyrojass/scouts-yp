import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryCompletionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  activityId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  setId?: string;

  @IsOptional()
  @IsIn(['completedAt', 'earnedPoints'])
  sortBy?: string = 'completedAt';
}
