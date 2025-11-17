import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class CreateSaleDto {
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsNumber()
  @Min(0)
  subtotal!: number;

  @IsNumber()
  @Min(0)
  tax!: number;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  reference?: string;
}

