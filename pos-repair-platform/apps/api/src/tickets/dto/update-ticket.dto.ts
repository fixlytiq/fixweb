import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MinLength, Min, ValidateIf } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class UpdateTicketDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @ValidateIf((o) => o.technicianId !== null)
  @IsString()
  technicianId?: string | null;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  subtotal?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  total?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

