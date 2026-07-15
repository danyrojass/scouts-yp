import { IsString, MinLength } from 'class-validator';

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
}
