import { IsString, IsOptional, IsEnum, IsNumber, IsDateString, MinLength, Min } from 'class-validator';
import { TicketStatus } from '@prisma/client';

export class CreateTicketDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  technicianId?: string;

  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

