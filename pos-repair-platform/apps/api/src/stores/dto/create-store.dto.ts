import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsEmail()
  storeEmail!: string;

  @IsOptional()
  @IsString()
  timezone?: string;
}

