import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRefundDto } from './dto/create-refund.dto';
import { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Injectable()
export class RefundsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createRefundDto: CreateRefundDto) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can issue refunds');
    }

    const sale = await this.prisma.sale.findFirst({
      where: {
        id: createRefundDto.saleId,
        storeId: user.storeId,
      },
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Verify sale hasn't already been refunded
    if (sale.paymentStatus === 'REFUNDED') {
      throw new BadRequestException('Sale has already been refunded');
    }

    const refund = await this.prisma.refund.create({
      data: {
        storeId: user.storeId,
        saleId: createRefundDto.saleId,
        refundedById: user.employeeId,
        amount: createRefundDto.amount,
        reason: createRefundDto.reason,
      },
      include: {
        sale: true,
        refundedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });

    await this.prisma.sale.update({
      where: { id: sale.id },
      data: { paymentStatus: 'REFUNDED' },
    });

    return refund;
  }

  async findAll(user: UserPayload) {
    return this.prisma.refund.findMany({
      where: { storeId: user.storeId },
      include: {
        sale: true,
        refundedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        store: true,
      },
      orderBy: { refundedAt: 'desc' },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const refund = await this.prisma.refund.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        sale: true,
        refundedBy: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        store: true,
      },
    });

    if (!refund) {
      throw new NotFoundException(`Refund ${id} not found`);
    }

    return refund;
  }
}

