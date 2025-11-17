import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { CreateTicketNoteDto } from './dto/create-ticket-note.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole, TicketStatus } from '@prisma/client';

@Controller('tickets')
@UseGuards(JwtAuthGuard)
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  create(@GetUser() user: UserPayload, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(user, createTicketDto);
  }

  @Get()
  findAll(
    @GetUser() user: UserPayload,
    @Query('status') status?: TicketStatus,
    @Query('technicianId') technicianId?: string,
  ) {
    return this.ticketsService.findAll(user, status, technicianId);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.ticketsService.findOne(user, id);
  }

  @Patch(':id')
  update(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(user, id, updateTicketDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER, StoreRole.TECHNICIAN)
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.ticketsService.remove(user, id);
  }

  @Post(':id/notes')
  addNote(
    @GetUser() user: UserPayload,
    @Param('id') ticketId: string,
    @Body() createNoteDto: CreateTicketNoteDto,
  ) {
    return this.ticketsService.addNote(user, ticketId, createNoteDto);
  }

  @Get(':id/notes')
  getNotes(@GetUser() user: UserPayload, @Param('id') ticketId: string) {
    return this.ticketsService.getNotes(user, ticketId);
  }
}

