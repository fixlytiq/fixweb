import { IsString, IsOptional, IsInt, IsNumber, IsObject, Min } from 'class-validator';

export class CreatePurchaseOrderItemDto {
  @IsOptional()
  @IsString()
  stockItemId?: string;

  @IsString()
  sku: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsNumber()
  unitCost?: number;

  @IsOptional()
  @IsNumber()
  totalCost?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

