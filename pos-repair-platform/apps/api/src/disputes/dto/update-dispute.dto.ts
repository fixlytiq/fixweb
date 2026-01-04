import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class UpdateDisputeDto {
  @IsOptional()
  @IsString()
  ticketId?: string;

  @IsOptional()
  @IsString()
  raisedById?: string;

  @IsOptional()
  @IsString()
  assignedToId?: string;

  @IsOptional()
  @IsEnum(DisputeStatus)
  status?: DisputeStatus;

  @IsOptional()
  @IsString()
  summary?: string;

  @IsOptional()
  @IsString()
  resolution?: string;

  @IsOptional()
  @IsDateString()
  resolvedAt?: string;
}

