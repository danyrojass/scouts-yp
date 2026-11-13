import { IsDefined, IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGroupAdminDto } from './create-group-admin.dto.js';

export class CreateGroupDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @MinLength(1)
  number!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  /** Primer administrador del grupo; se crea en la misma transacción. */
  @IsDefined()
  @ValidateNested()
  @Type(() => CreateGroupAdminDto)
  admin!: CreateGroupAdminDto;
}
