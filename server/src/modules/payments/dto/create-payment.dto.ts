import { IsDateString, IsNumber, IsOptional, IsString, IsPositive, Length, MinLength } from 'class-validator';

export class CreatePaymentDto {
  @IsString()
  userId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsString()
  @Length(3, 3)
  currency?: string;

  @IsString()
  @MinLength(2)
  concept!: string;

  @IsOptional()
  @IsDateString()
  paidAt?: string;
}
