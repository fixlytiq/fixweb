import { IsString, IsEmail, IsOptional, MinLength, Matches } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  storeEmail!: string;

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
}

