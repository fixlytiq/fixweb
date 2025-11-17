import { IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { TicketNoteVisibility } from '@prisma/client';

export class CreateTicketNoteDto {
  @IsString()
  @MinLength(1)
  body!: string;

  @IsOptional()
  @IsEnum(TicketNoteVisibility)
  visibility?: TicketNoteVisibility;
}

