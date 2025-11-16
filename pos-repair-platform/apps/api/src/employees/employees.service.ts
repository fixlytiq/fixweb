import { Injectable, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UserPayload } from '../auth/types';
import * as bcrypt from 'bcrypt';

@Injectable()
export class EmployeesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, dto: CreateEmployeeDto) {
    // Only store OWNER or MANAGER can create employees
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Store Owners and Managers can create employees');
    }

    // Check if any employee in this store already has this PIN
    const existingEmployees = await this.prisma.employee.findMany({
      where: { storeId: user.storeId },
      select: { pin: true },
    });

    // Compare the plain PIN with all existing hashed PINs
    for (const employee of existingEmployees) {
      const isMatch = await bcrypt.compare(dto.pin, employee.pin);
      if (isMatch) {
        throw new ConflictException('An employee with this PIN already exists in this store. Each employee must have a unique PIN.');
      }
    }

    const salt = await bcrypt.genSalt();
    const hashedPin = await bcrypt.hash(dto.pin, salt);

    return this.prisma.employee.create({
      data: {
        name: dto.name,
        pin: hashedPin,
        role: dto.role,
        storeId: user.storeId,
      },
      select: { id: true, name: true, role: true },
    });
  }

  async findAll(user: UserPayload) {
    return this.prisma.employee.findMany({
      where: { storeId: user.storeId },
      select: { id: true, name: true, role: true },
    });
  }

  async remove(user: UserPayload, employeeId: string) {
    if (user.role !== 'OWNER' && user.role !== 'MANAGER') {
      throw new ForbiddenException('Only Store Owners and Managers can remove employees');
    }

    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, storeId: user.storeId },
    });

    if (!employee) {
      throw new ForbiddenException('Access denied');
    }

    if (employee.role === 'OWNER') {
      throw new ForbiddenException('Cannot delete the store owner');
    }

    return this.prisma.employee.delete({
      where: { id: employeeId },
    });
  }
}

