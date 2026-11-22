import { IsOptional, IsString, MinLength, IsBoolean } from 'class-validator';

export class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  number?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  city?: string;

  /** Solo lo puede cambiar el SUPER_ADMIN de plataforma. */
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
