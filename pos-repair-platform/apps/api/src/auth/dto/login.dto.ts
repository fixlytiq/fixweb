import { IsEmail, IsString, Length } from 'class-validator';

export class PinLoginDto {
  @IsEmail()
  storeEmail!: string;

  @IsString()
  @Length(4, 8)
  pin!: string;
}

