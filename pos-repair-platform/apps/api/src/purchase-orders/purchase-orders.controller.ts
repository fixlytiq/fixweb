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
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole, PurchaseOrderStatus } from '@prisma/client';

@Controller('purchase-orders')
@UseGuards(JwtAuthGuard)
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  create(@GetUser() user: UserPayload, @Body() createPurchaseOrderDto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(user, createPurchaseOrderDto);
  }

  @Get()
  findAll(
    @GetUser() user: UserPayload,
    @Query('status') status?: PurchaseOrderStatus,
    @Query('vendorId') vendorId?: string,
  ) {
    return this.purchaseOrdersService.findAll(user, status, vendorId);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.findOne(user, id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  update(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updatePurchaseOrderDto: UpdatePurchaseOrderDto,
  ) {
    return this.purchaseOrdersService.update(user, id, updatePurchaseOrderDto);
  }

  @Post(':id/submit')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  submit(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.submit(user, id);
  }

  @Post(':id/approve')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  approve(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.approve(user, id);
  }

  @Post(':id/receive')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  receive(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.receive(user, id);
  }

  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  cancel(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.cancel(user, id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.purchaseOrdersService.remove(user, id);
  }
}

