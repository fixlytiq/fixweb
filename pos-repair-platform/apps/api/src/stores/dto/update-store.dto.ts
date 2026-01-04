import { IsString, IsOptional, MinLength, IsEmail, Matches, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Phone number must be in E.164 format (e.g., +1234567890)',
  })
  storePhone?: string;

  @IsOptional()
  @IsEmail()
  notificationEmail?: string;

  @IsOptional()
  @IsString()
  timezone?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @Max(1)
  taxRate?: number;
}

