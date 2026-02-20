import { Injectable, NotFoundException, ForbiddenException, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentService } from '../payment/payment.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UserPayload } from '../auth/types';
import { StoreRole, PaymentStatus } from '@prisma/client';
import { StockMovementReason, TransactionStatus } from '@prisma/client';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

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

    // If customerId is provided, verify the customer exists
    if (createSaleDto.customerId) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: createSaleDto.customerId,
        },
      });

      if (!customer) {
        throw new NotFoundException(`Customer ${createSaleDto.customerId} not found`);
      }
    }

    const lineItems = createSaleDto.lineItems ?? [];
    const paymentMethod = createSaleDto.paymentMethod ?? 'CASH';
    const isCard = paymentMethod === 'CARD';

    if (isCard && !createSaleDto.idempotencyKey) {
      throw new BadRequestException('idempotencyKey is required when paymentMethod is CARD');
    }

    // Validate stock availability for line items that have stockItemId
    for (const item of lineItems) {
      if (item.stockItemId) {
        const stockItem = await this.prisma.stockItem.findFirst({
          where: {
            id: item.stockItemId,
            storeId: user.storeId,
          },
        });
        if (!stockItem) {
          throw new BadRequestException(`Stock item ${item.stockItemId} not found`);
        }
        const qty = Math.floor(Number(item.quantity));
        if (stockItem.quantityOnHand < qty) {
          throw new BadRequestException(
            `Insufficient stock for "${stockItem.name}": have ${stockItem.quantityOnHand}, need ${qty}`,
          );
        }
      }
    }

    try {
      const saleId = crypto.randomUUID();
      const totalAmount = Number(createSaleDto.total);
      const amountCents = Math.round(totalAmount * 100);

      if (isCard) {
        // Card flow: create Sale PENDING + line items only; no inventory deduction yet.
        await this.prisma.$transaction(async (tx) => {
          await tx.sale.create({
            data: {
              id: saleId,
              storeId: user.storeId,
              ticketId: createSaleDto.ticketId || undefined,
              customerId: createSaleDto.customerId || undefined,
              subtotal: createSaleDto.subtotal,
              tax: createSaleDto.tax,
              total: createSaleDto.total,
              paymentStatus: PaymentStatus.PENDING,
              reference: createSaleDto.reference || undefined,
              updatedAt: new Date(),
            },
          });
          for (const item of lineItems) {
            const qty = Math.floor(Number(item.quantity));
            const unitPrice = Number(item.unitPrice);
            const lineTotal = unitPrice * qty;
            const lineItemId = crypto.randomUUID();
            await tx.saleLineItem.create({
              data: {
                id: lineItemId,
                saleId,
                stockItemId: item.stockItemId || undefined,
                description: item.description,
                quantity: qty,
                unitPrice,
                total: lineTotal,
              },
            });
          }
        });

        const confirmResult = await this.paymentService.confirmPayment({
          saleId,
          storeId: user.storeId,
          amountCents,
          idempotencyKey: createSaleDto.idempotencyKey!,
          token: createSaleDto.paymentToken,
        });

        if (confirmResult.status === TransactionStatus.SUCCEEDED) {
          await this.deductInventoryForSale(saleId, user.storeId, createSaleDto.ticketId);
        } else {
          const msg =
            confirmResult.internalErrorCode ?? confirmResult.status;
          throw new BadRequestException(
            `Payment failed: ${msg}. Sale ${saleId} remains PENDING.`,
          );
        }
      } else {
        // Cash flow: create Sale PAID + line items + inventory deduction in one transaction.
        const paidAt = new Date();
        await this.prisma.$transaction(async (tx) => {
          await tx.sale.create({
            data: {
              id: saleId,
              storeId: user.storeId,
              ticketId: createSaleDto.ticketId || undefined,
              customerId: createSaleDto.customerId || undefined,
              subtotal: createSaleDto.subtotal,
              tax: createSaleDto.tax,
              total: createSaleDto.total,
              paymentStatus: createSaleDto.paymentStatus ?? PaymentStatus.PAID,
              reference: createSaleDto.reference || undefined,
              paidAt,
              updatedAt: new Date(),
            },
          });
          for (const item of lineItems) {
            const qty = Math.floor(Number(item.quantity));
            const unitPrice = Number(item.unitPrice);
            const lineTotal = unitPrice * qty;
            const lineItemId = crypto.randomUUID();
            await tx.saleLineItem.create({
              data: {
                id: lineItemId,
                saleId,
                stockItemId: item.stockItemId || undefined,
                description: item.description,
                quantity: qty,
                unitPrice,
                total: lineTotal,
              },
            });
            if (item.stockItemId && qty > 0) {
              await tx.stockMovement.create({
                data: {
                  id: crypto.randomUUID(),
                  storeId: user.storeId,
                  stockItemId: item.stockItemId,
                  quantityChange: -qty,
                  reason: StockMovementReason.SALE,
                  saleLineItemId: lineItemId,
                  ticketId: createSaleDto.ticketId || undefined,
                },
              });
              await tx.stockItem.update({
                where: { id: item.stockItemId },
                data: {
                  quantityOnHand: { decrement: qty },
                  updatedAt: new Date(),
                },
              });
            }
          }
        });
      }

      return this.prisma.sale.findUnique({
        where: { id: saleId },
        include: {
          Customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          Ticket: {
            select: {
              id: true,
              title: true,
              status: true,
            },
          },
          SaleLineItem: true,
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
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Ticket: {
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
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Ticket: {
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

  /**
   * Deduct inventory for a sale (after payment confirmed). Used for CARD flow.
   */
  async deductInventoryForSale(
    saleId: string,
    storeId: string,
    ticketId?: string,
  ): Promise<void> {
    const lineItems = await this.prisma.saleLineItem.findMany({
      where: { saleId },
    });
    await this.prisma.$transaction(async (tx) => {
      for (const item of lineItems) {
        if (!item.stockItemId || item.quantity <= 0) continue;
        const qty = item.quantity;
        await tx.stockMovement.create({
          data: {
            id: crypto.randomUUID(),
            storeId,
            stockItemId: item.stockItemId,
            quantityChange: -qty,
            reason: StockMovementReason.SALE,
            saleLineItemId: item.id,
            ticketId: ticketId || null,
          },
        });
        await tx.stockItem.update({
          where: { id: item.stockItemId },
          data: {
            quantityOnHand: { decrement: qty },
            updatedAt: new Date(),
          },
        });
      }
    });
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
        Customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        Ticket: {
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
}

