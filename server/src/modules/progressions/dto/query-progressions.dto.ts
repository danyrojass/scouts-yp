import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto.js';

export class QueryProgressionsDto extends PaginationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsIn(['pending', 'approved'])
  status?: 'pending' | 'approved';

  @IsOptional()
  @IsIn(['createdAt', 'approvedAt'])
  sortBy?: string;
}
