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
import { VendorsService } from './vendors.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Controller('vendors')
@UseGuards(JwtAuthGuard)
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  create(@GetUser() user: UserPayload, @Body() createVendorDto: CreateVendorDto) {
    return this.vendorsService.create(user, createVendorDto);
  }

  @Get()
  findAll(
    @GetUser() user: UserPayload,
    @Query('search') search?: string,
  ) {
    return this.vendorsService.findAll(user, search);
  }

  @Get(':id')
  findOne(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.vendorsService.findOne(user, id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  update(
    @GetUser() user: UserPayload,
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(user, id, updateVendorDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.vendorsService.remove(user, id);
  }
}

