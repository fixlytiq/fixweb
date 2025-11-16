import { IsEmail, IsString, Length } from 'class-validator';

export class RegisterDto {
  @IsString()
  ownerName!: string;

  @IsString()
  storeName!: string;

  @IsEmail()
  storeEmail!: string;

  @IsString()
  @Length(4, 8)
  pin!: string;
}

