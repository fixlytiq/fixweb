import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UserPayload } from '../auth/types';
import { StoreRole, PaymentStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createSaleDto: CreateSaleDto) {
    // OWNER, MANAGER, and CASHIER can create sales
    if (
      user.role !== StoreRole.OWNER &&
      user.role !== StoreRole.MANAGER &&
      user.role !== StoreRole.CASHIER
    ) {
      throw new ForbiddenException('You do not have permission to create sales');
    }

    // If ticketId is provided, verify the ticket exists and belongs to the store
    if (createSaleDto.ticketId) {
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: createSaleDto.ticketId,
          storeId: user.storeId,
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${createSaleDto.ticketId} not found`);
      }
    }

    // If customerId is provided, verify the customer exists and belongs to the store
    if (createSaleDto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: createSaleDto.customerId,
          storeId: user.storeId,
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer ${createSaleDto.customerId} not found`);
      }
    }

    try {
      // Create sale without includes first to avoid relation errors
      const sale = await this.prisma.sale.create({
        data: {
          storeId: user.storeId,
          ticketId: createSaleDto.ticketId || undefined,
          customerId: createSaleDto.customerId || undefined,
          subtotal: createSaleDto.subtotal,
          tax: createSaleDto.tax,
          total: createSaleDto.total,
          paymentStatus: createSaleDto.paymentStatus || PaymentStatus.PAID,
          reference: createSaleDto.reference || undefined,
          paidAt: createSaleDto.paymentStatus === PaymentStatus.PAID ? new Date() : undefined,
        },
      });

      // Then fetch with relations if needed
      return this.prisma.sale.findUnique({
        where: { id: sale.id },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          ticket: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
        },
      });
    } catch (error: any) {
      console.error('Error creating sale:', error);
      console.error('Error message:', error.message);
      console.error('Error code:', error.code);
      console.error('Error meta:', error.meta);
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        throw new BadRequestException('A sale with this information already exists');
      }
      if (error.code === 'P2003') {
        throw new BadRequestException(`Invalid foreign key reference: ${error.meta?.field_name || 'store, ticket, or customer not found'}`);
      }
      if (error.code === 'P2025') {
        throw new NotFoundException('Record not found');
      }
      
      // Return more detailed error message
      const errorMessage = error.message || 'Unknown error';
      console.error('Full error stack:', error.stack);
      
      throw new HttpException(
        `Failed to create sale: ${errorMessage}. Error code: ${error.code || 'N/A'}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(user: UserPayload, ticketId?: string) {
    const where: any = {
      storeId: user.storeId,
    };

    // Filter by ticketId if provided
    if (ticketId) {
      where.ticketId = ticketId;
    }

    return this.prisma.sale.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const sale = await this.prisma.sale.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Sale ${id} not found`);
    }

    return sale;
  }

  async findByTicketId(user: UserPayload, ticketId: string) {
    // Verify ticket exists and belongs to the store
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id: ticketId,
        storeId: user.storeId,
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket ${ticketId} not found`);
    }

    return this.prisma.sale.findMany({
      where: {
        ticketId,
        storeId: user.storeId,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

