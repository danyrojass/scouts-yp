import { IsDateString, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateCompletionDto {
  @IsString()
  activityId!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  setId?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  earnedPoints?: number;

  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
