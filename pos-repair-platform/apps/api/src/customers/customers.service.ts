import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UserPayload } from '../auth/types';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createCustomerDto: CreateCustomerDto) {
    // Validate that at least one identifier is provided
    if (!createCustomerDto.firstName && !createCustomerDto.lastName && !createCustomerDto.email && !createCustomerDto.phone) {
      throw new BadRequestException('At least one of firstName, lastName, email, or phone must be provided');
    }

    // Check for duplicate email if provided
    if (createCustomerDto.email) {
      const existing = await this.prisma.customer.findFirst({
        where: { email: createCustomerDto.email },
      });
      if (existing) {
        throw new BadRequestException(`Customer with email ${createCustomerDto.email} already exists`);
      }
    }

    return this.prisma.customer.create({
      data: {
        id: crypto.randomUUID(),
        firstName: createCustomerDto.firstName || undefined,
        lastName: createCustomerDto.lastName || undefined,
        email: createCustomerDto.email || undefined,
        phone: createCustomerDto.phone || undefined,
        notes: createCustomerDto.notes || undefined,
        updatedAt: new Date(),
      },
    });
  }

  async findAll(user: UserPayload, search?: string, limit?: number) {
    const take = limit ? Math.min(limit, 100) : 50; // Max 100 results

    const where: any = {};

    // If search term provided, search across name, email, and phone
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    } else {
      // If no search term, show customers who have tickets or sales in this store
      // This helps show relevant customers for the store
      where.OR = [
        {
          Ticket: {
            some: {
              storeId: user.storeId,
            },
          },
        },
        {
          Sale: {
            some: {
              storeId: user.storeId,
            },
          },
        },
      ];
    }

    return this.prisma.customer.findMany({
      where,
      take,
      orderBy: [
        { updatedAt: 'desc' },
        { createdAt: 'desc' },
      ],
      include: {
        _count: {
          select: {
            Ticket: true,
            Sale: true,
          },
        },
      },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Ticket: true,
            Sale: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  async update(user: UserPayload, id: string, updateCustomerDto: UpdateCustomerDto) {
    // Check if customer exists
    const existing = await this.prisma.customer.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check for duplicate email if being updated
    if (updateCustomerDto.email && updateCustomerDto.email !== existing.email) {
      const duplicate = await this.prisma.customer.findFirst({
        where: { 
          email: updateCustomerDto.email,
          id: { not: id },
        },
      });
      if (duplicate) {
        throw new BadRequestException(`Customer with email ${updateCustomerDto.email} already exists`);
      }
    }

    return this.prisma.customer.update({
      where: { id },
      data: {
        ...updateCustomerDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(user: UserPayload, id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            Ticket: true,
            Sale: true,
          },
        },
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Check if customer has associated tickets or sales
    if (customer._count.Ticket > 0 || customer._count.Sale > 0) {
      throw new BadRequestException(
        `Cannot delete customer with ${customer._count.Ticket} ticket(s) and ${customer._count.Sale} sale(s). Please remove or reassign these records first.`
      );
    }

    return this.prisma.customer.delete({
      where: { id },
    });
  }
}

