import { IsString, Length, IsEnum } from 'class-validator';
import { StoreRole } from '@prisma/client';

export class CreateEmployeeDto {
  @IsString()
  name!: string;

  @IsString()
  @Length(4, 8)
  pin!: string;

  @IsEnum(StoreRole)
  role!: StoreRole;
}

