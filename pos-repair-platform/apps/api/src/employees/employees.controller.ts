import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StoreRole } from '@prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { UserPayload } from '../auth/types';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Post()
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  create(@GetUser() user: UserPayload, @Body() dto: CreateEmployeeDto) {
    return this.employeesService.create(user, dto);
  }

  @Get()
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  findAll(@GetUser() user: UserPayload) {
    return this.employeesService.findAll(user);
  }

  @Delete(':id')
  @Roles(StoreRole.OWNER, StoreRole.MANAGER)
  remove(@GetUser() user: UserPayload, @Param('id') id: string) {
    return this.employeesService.remove(user, id);
  }
}

