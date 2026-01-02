import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(StoreRole.OWNER, StoreRole.MANAGER)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('summary')
  async getSummary(
    @GetUser() user: UserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.reportsService.getSummary(user, from, to, storeId);
  }

  @Get('sales')
  async getSalesReport(
    @GetUser() user: UserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.reportsService.getSalesReport(user, from, to, storeId);
  }

  @Get('tickets')
  async getTicketsReport(
    @GetUser() user: UserPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('storeId') storeId?: string,
  ) {
    return this.reportsService.getTicketsReport(user, from, to, storeId);
  }

  @Get('inventory-low')
  async getInventoryLowReport(
    @GetUser() user: UserPayload,
    @Query('threshold') threshold?: string,
    @Query('storeId') storeId?: string,
  ) {
    const thresholdNum = threshold ? parseInt(threshold, 10) : 10;
    return this.reportsService.getInventoryLowReport(user, thresholdNum, storeId);
  }
}

