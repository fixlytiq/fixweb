import { IsString, IsOptional, IsEnum, IsDateString, IsNumber } from 'class-validator';
import { PurchaseOrderStatus } from '@prisma/client';

export class UpdatePurchaseOrderDto {
  @IsOptional()
  @IsString()
  vendorId?: string;

  @IsOptional()
  @IsEnum(PurchaseOrderStatus)
  status?: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsDateString()
  expectedAt?: string;

  @IsOptional()
  @IsDateString()
  orderedAt?: string;

  @IsOptional()
  @IsDateString()
  receivedAt?: string;

  @IsOptional()
  @IsNumber()
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsOptional()
  @IsNumber()
  total?: number;
}

