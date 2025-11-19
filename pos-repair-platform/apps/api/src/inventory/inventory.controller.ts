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
import { InventoryService } from './inventory.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  create(@GetUser() user: UserPayload, @Body() createStockItemDto: CreateStockItemDto) {
    return this.inventoryService.create(user, createStockItemDto);
  }

  @Get()
  findAll(@GetUser() user: UserPayload, @Query('categoryId') categoryId?: string) {
    return this.inventoryService.findAll(user, categoryId);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.inventoryService.findOne(user, id);
  }

  @Patch(':id')
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  update(@GetUser() user: UserPayload, @Param('id') id: string, @Body() updateStockItemDto: UpdateStockItemDto) {
    return this.inventoryService.update(user, id, updateStockItemDto);
  }

  @Post(':id/adjust')
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  adjustStock(@GetUser() user: UserPayload, @Param('id') id: string, @Body() adjustStockDto: AdjustStockDto) {
    return this.inventoryService.adjustStock(user, id, adjustStockDto);
  }

  @Delete(':id')
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.inventoryService.remove(user, id);
  }
}

