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
import { DisputesService } from './disputes.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { CreateDisputeEvidenceDto } from './dto/create-dispute-evidence.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole, DisputeStatus } from '@prisma/client';

@Controller('disputes')
@UseGuards(JwtAuthGuard)
export class DisputesController {
  constructor(private readonly disputesService: DisputesService) {}

  @Post()
  create(@GetUser() user: UserPayload, @Body() createDisputeDto: CreateDisputeDto) {
    return this.disputesService.create(user, createDisputeDto);
  }

  @Get()
  findAll(
    @GetUser() user: UserPayload,
    @Query('status') status?: DisputeStatus,
    @Query('ticketId') ticketId?: string,
  ) {
    return this.disputesService.findAll(user, status, ticketId);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.disputesService.findOne(user, id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  update(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateDisputeDto: UpdateDisputeDto,
  ) {
    return this.disputesService.update(user, id, updateDisputeDto);
  }

  @Post(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  resolve(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() body: { resolution: string },
  ) {
    return this.disputesService.resolve(user, id, body.resolution);
  }

  @Post(':id/dismiss')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  dismiss(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.disputesService.dismiss(user, id);
  }

  @Post(':id/evidence')
  addEvidence(
    @GetUser() user: UserPayload,
    @Param('id') disputeId: string,
    @Body() createEvidenceDto: CreateDisputeEvidenceDto,
  ) {
    return this.disputesService.addEvidence(user, disputeId, createEvidenceDto);
  }

  @Delete(':id/evidence/:evidenceId')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  removeEvidence(
    @GetUser() user: UserPayload,
    @Param('id') disputeId: string,
    @Param('evidenceId') evidenceId: string,
  ) {
    return this.disputesService.removeEvidence(user, disputeId, evidenceId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.disputesService.remove(user, id);
  }
}

