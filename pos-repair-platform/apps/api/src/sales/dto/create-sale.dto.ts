import { IsOptional, IsString, IsNumber, IsEnum, Min, IsArray, ValidateNested, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentStatus } from '@prisma/client';

export class CreateSaleLineItemDto {
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @IsString()
  description!: string;

  @IsNumber()
  @Min(1)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;
}

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

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateSaleLineItemDto)
  lineItems?: CreateSaleLineItemDto[];

  /** CASH = immediate PAID + inventory deduction. CARD = PENDING then confirm via adapter (requires idempotencyKey). */
  @IsOptional()
  @IsIn(['CASH', 'CARD'])
  paymentMethod?: 'CASH' | 'CARD';

  /** Required for CARD. Format e.g. saleId-attemptNumber to avoid double charge. */
  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  /** Provider payment token (e.g. Stripe). Never send raw card data (PCI). */
  @IsOptional()
  @IsString()
  paymentToken?: string;
}

