import { IsEmail, IsString, Length, IsOptional, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  ownerName!: string;

  @IsString()
  storeName!: string;

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

  @IsString()
  @Length(4, 8)
  pin!: string;
}

