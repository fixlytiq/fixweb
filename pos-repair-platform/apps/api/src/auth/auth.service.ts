import { Injectable, ConflictException, NotFoundException, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { PinLoginDto } from './dto/login.dto';
import { StoreRole } from '@prisma/client';
import { UserPayload } from './types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    try {
      const { ownerName, storeName, storeEmail, pin } = dto;

      // Check if store email is taken
      const existingStore = await this.prisma.store.findUnique({
        where: { storeEmail },
      });
      if (existingStore) {
        throw new ConflictException('Store email is already in use');
      }

      // Check if owner email is taken
      const existingOwner = await this.prisma.owner.findUnique({
        where: { email: storeEmail },
      });
      if (existingOwner) {
        throw new ConflictException('Email is already registered');
      }

      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(pin, salt);

      const owner = await this.prisma.owner.create({
        data: {
          id: crypto.randomUUID(),
          email: storeEmail,
          password: hashedPassword,
        },
      });

      const store = await this.prisma.store.create({
        data: {
          id: crypto.randomUUID(),
          name: storeName,
          storeEmail: storeEmail,
          storePhone: dto.storePhone || null,
          notificationEmail: dto.notificationEmail || storeEmail,
          ownerId: owner.id,
          updatedAt: new Date(),
        },
      });

      const employee = await this.prisma.employee.create({
        data: {
          id: crypto.randomUUID(),
          name: ownerName,
          pin: hashedPassword,
          role: StoreRole.OWNER,
          storeId: store.id,
        },
      });

      const token = await this.signToken(employee.id, store.id, employee.role);

      return {
        token: token.accessToken,
        store: {
          id: store.id,
          name: store.name,
          storeEmail: store.storeEmail,
        },
        employee: {
          id: employee.id,
          name: employee.name,
          role: employee.role,
        },
      };
    } catch (error: any) {
      // Log the error for debugging
      console.error('Registration error:', error);
      
      // Re-throw known exceptions
      if (error instanceof ConflictException || error instanceof NotFoundException || error instanceof UnauthorizedException) {
        throw error;
      }
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        throw new ConflictException('Email or store email is already in use');
      }
      
      // Generic error
      throw new HttpException(
        `Registration failed: ${error.message || 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async pinLogin(dto: PinLoginDto) {
    const { storeEmail, pin } = dto;

    const store = await this.prisma.store.findUnique({
      where: { storeEmail },
    });
    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const employees = await this.prisma.employee.findMany({
      where: { storeId: store.id },
    });

    let authenticatedEmployee: { id: string; storeId: string; role: StoreRole } | null = null;
    for (const employee of employees) {
      const isMatch = await bcrypt.compare(pin, employee.pin);
      if (isMatch) {
        authenticatedEmployee = employee;
        break;
      }
    }

    if (!authenticatedEmployee) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const token = await this.signToken(authenticatedEmployee.id, authenticatedEmployee.storeId, authenticatedEmployee.role);

    return {
      token: token.accessToken,
      user: {
        employeeId: authenticatedEmployee.id,
        storeId: authenticatedEmployee.storeId,
        role: authenticatedEmployee.role,
      },
    };
  }

  async signToken(employeeId: string, storeId: string, role: StoreRole) {
    const payload: UserPayload = {
      employeeId,
      storeId,
      role,
    };

    const token = await this.jwtService.signAsync(payload, {
      subject: employeeId,
    });

    return { accessToken: token };
  }
}

