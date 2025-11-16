import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { StockMovementReason } from '@prisma/client';

export class AdjustStockDto {
  @IsNumber()
  quantityChange!: number;

  @IsOptional()
  @IsEnum(StockMovementReason)
  reason?: StockMovementReason;

  @IsOptional()
  @IsString()
  note?: string;
}

