import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { DisputeEvidenceType } from '@prisma/client';

export class CreateDisputeEvidenceDto {
  @IsEnum(DisputeEvidenceType)
  type: DisputeEvidenceType;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

