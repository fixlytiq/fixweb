import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Controller('sales')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER, StoreRole.CASHIER)
  create(@GetUser() user: UserPayload, @Body() createSaleDto: CreateSaleDto) {
    return this.salesService.create(user, createSaleDto);
  }

  @Get()
  findAll(
    @GetUser() user: UserPayload,
    @Query('ticketId') ticketId?: string,
  ) {
    if (ticketId) {
      return this.salesService.findByTicketId(user, ticketId);
    }
    return this.salesService.findAll(user);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.salesService.findOne(user, id);
  }
}

