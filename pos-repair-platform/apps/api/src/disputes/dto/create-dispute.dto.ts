import { IsString, IsOptional, IsEnum } from 'class-validator';
import { DisputeStatus } from '@prisma/client';

export class CreateDisputeDto {
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

  @IsString()
  summary: string;

  @IsOptional()
  @IsString()
  resolution?: string;
}

