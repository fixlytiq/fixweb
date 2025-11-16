import { IsUUID, IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';

export class CreateRefundDto {
  @IsUUID()
  saleId!: string;

  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

