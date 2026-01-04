import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { UserPayload } from '../auth/types';
import { StoreRole, PurchaseOrderStatus, StockMovementReason } from '@prisma/client';

@Injectable()
export class PurchaseOrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createPurchaseOrderDto: CreatePurchaseOrderDto) {
    // Only OWNER and MANAGER can create purchase orders
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to create purchase orders');
    }

    // Validate vendor if provided
    if (createPurchaseOrderDto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: {
          id: createPurchaseOrderDto.vendorId,
          storeId: user.storeId,
        },
      });

      if (!vendor) {
        throw new NotFoundException(`Vendor ${createPurchaseOrderDto.vendorId} not found`);
      }
    }

    // Validate items
    if (!createPurchaseOrderDto.items || createPurchaseOrderDto.items.length === 0) {
      throw new BadRequestException('Purchase order must have at least one item');
    }

    // Calculate totals
    let subtotal = 0;
    const items = createPurchaseOrderDto.items.map((item) => {
      const itemTotal = item.totalCost || (item.unitCost ? item.unitCost * item.quantity : 0);
      subtotal += itemTotal;
      return {
        id: crypto.randomUUID(),
        stockItemId: item.stockItemId || undefined,
        sku: item.sku,
        description: item.description || undefined,
        quantity: item.quantity,
        unitCost: item.unitCost || undefined,
        totalCost: itemTotal || undefined,
        metadata: item.metadata || undefined,
      };
    });

    const tax = 0; // Could be calculated based on tax rate
    const total = subtotal + tax;

    // Create purchase order with items
    return this.prisma.purchaseOrder.create({
      data: {
        id: crypto.randomUUID(),
        storeId: user.storeId,
        vendorId: createPurchaseOrderDto.vendorId || undefined,
        status: createPurchaseOrderDto.status || PurchaseOrderStatus.DRAFT,
        reference: createPurchaseOrderDto.reference || undefined,
        notes: createPurchaseOrderDto.notes || undefined,
        expectedAt: createPurchaseOrderDto.expectedAt ? new Date(createPurchaseOrderDto.expectedAt) : undefined,
        subtotal: subtotal || undefined,
        tax: tax || undefined,
        total: total || undefined,
        PurchaseOrderItem: {
          create: items,
        },
      },
      include: {
        Vendor: true,
        PurchaseOrderItem: {
          include: {
            StockItem: true,
          },
        },
      },
    });
  }

  async findAll(user: UserPayload, status?: PurchaseOrderStatus, vendorId?: string) {
    const where: any = {
      storeId: user.storeId,
    };

    if (status) {
      where.status = status;
    }

    if (vendorId) {
      where.vendorId = vendorId;
    }

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        Vendor: true,
        PurchaseOrderItem: {
          include: {
            StockItem: true,
          },
        },
        _count: {
          select: {
            PurchaseOrderItem: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        Vendor: true,
        PurchaseOrderItem: {
          include: {
            StockItem: true,
          },
        },
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }

    return purchaseOrder;
  }

  async update(user: UserPayload, id: string, updatePurchaseOrderDto: UpdatePurchaseOrderDto) {
    // Only OWNER and MANAGER can update purchase orders
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to update purchase orders');
    }

    const existing = await this.prisma.purchaseOrder.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Purchase order ${id} not found`);
    }

    // Validate status transitions
    if (updatePurchaseOrderDto.status && updatePurchaseOrderDto.status !== existing.status) {
      this.validateStatusTransition(existing.status, updatePurchaseOrderDto.status);
    }

    // Validate vendor if provided
    if (updatePurchaseOrderDto.vendorId) {
      const vendor = await this.prisma.vendor.findFirst({
        where: {
          id: updatePurchaseOrderDto.vendorId,
          storeId: user.storeId,
        },
      });

      if (!vendor) {
        throw new NotFoundException(`Vendor ${updatePurchaseOrderDto.vendorId} not found`);
      }
    }

    const updateData: any = {};

    if (updatePurchaseOrderDto.vendorId !== undefined) {
      updateData.vendorId = updatePurchaseOrderDto.vendorId || null;
    }
    if (updatePurchaseOrderDto.status !== undefined) {
      updateData.status = updatePurchaseOrderDto.status;
    }
    if (updatePurchaseOrderDto.reference !== undefined) {
      updateData.reference = updatePurchaseOrderDto.reference || null;
    }
    if (updatePurchaseOrderDto.notes !== undefined) {
      updateData.notes = updatePurchaseOrderDto.notes || null;
    }
    if (updatePurchaseOrderDto.expectedAt !== undefined) {
      updateData.expectedAt = updatePurchaseOrderDto.expectedAt ? new Date(updatePurchaseOrderDto.expectedAt) : null;
    }
    if (updatePurchaseOrderDto.orderedAt !== undefined) {
      updateData.orderedAt = updatePurchaseOrderDto.orderedAt ? new Date(updatePurchaseOrderDto.orderedAt) : null;
    }
    if (updatePurchaseOrderDto.receivedAt !== undefined) {
      updateData.receivedAt = updatePurchaseOrderDto.receivedAt ? new Date(updatePurchaseOrderDto.receivedAt) : null;
    }
    if (updatePurchaseOrderDto.subtotal !== undefined) {
      updateData.subtotal = updatePurchaseOrderDto.subtotal || null;
    }
    if (updatePurchaseOrderDto.tax !== undefined) {
      updateData.tax = updatePurchaseOrderDto.tax || null;
    }
    if (updatePurchaseOrderDto.total !== undefined) {
      updateData.total = updatePurchaseOrderDto.total || null;
    }

    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        Vendor: true,
        PurchaseOrderItem: {
          include: {
            StockItem: true,
          },
        },
      },
    });
  }

  async submit(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can submit
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to submit purchase orders');
    }

    const purchaseOrder = await this.findOne(user, id);

    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT) {
      throw new BadRequestException(`Cannot submit purchase order. Current status: ${purchaseOrder.status}`);
    }

    return this.update(user, id, { status: PurchaseOrderStatus.SUBMITTED });
  }

  async approve(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can approve
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to approve purchase orders');
    }

    const purchaseOrder = await this.findOne(user, id);

    if (purchaseOrder.status !== PurchaseOrderStatus.SUBMITTED) {
      throw new BadRequestException(`Cannot approve purchase order. Current status: ${purchaseOrder.status}`);
    }

    return this.update(user, id, {
      status: PurchaseOrderStatus.ORDERED,
      orderedAt: new Date().toISOString(),
    });
  }

  async receive(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can receive
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to receive purchase orders');
    }

    const purchaseOrder = await this.findOne(user, id);

    if (purchaseOrder.status !== PurchaseOrderStatus.ORDERED) {
      throw new BadRequestException(`Cannot receive purchase order. Current status: ${purchaseOrder.status}`);
    }

    // Use transaction to ensure atomicity
    return this.prisma.$transaction(async (tx) => {
      // Update purchase order status
      const updatedPO = await tx.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          receivedAt: new Date(),
          updatedAt: new Date(),
        },
        include: {
          PurchaseOrderItem: {
            include: {
              StockItem: true,
            },
          },
        },
      });

      // Create stock movements and update inventory for each item
      for (const item of updatedPO.PurchaseOrderItem) {
        if (item.stockItemId) {
          // Update existing stock item
          const stockItem = await tx.stockItem.findUnique({
            where: { id: item.stockItemId },
          });

          if (stockItem) {
            // Create stock movement
            await tx.stockMovement.create({
              data: {
                id: crypto.randomUUID(),
                storeId: user.storeId,
                stockItemId: item.stockItemId,
                purchaseOrderId: id,
                quantityChange: item.quantity,
                reason: StockMovementReason.PURCHASE,
                note: `Received from purchase order ${purchaseOrder.reference || id}`,
              },
            });

            // Update stock item quantity
            await tx.stockItem.update({
              where: { id: item.stockItemId },
              data: {
                quantityOnHand: {
                  increment: item.quantity,
                },
                updatedAt: new Date(),
              },
            });
          }
          }
          // Note: Items without stockItemId are not tracked in inventory
          // They may be one-time purchases or items not yet added to inventory
      }

      return updatedPO;
    });
  }

  async cancel(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can cancel
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to cancel purchase orders');
    }

    const purchaseOrder = await this.findOne(user, id);

    if (purchaseOrder.status === PurchaseOrderStatus.RECEIVED) {
      throw new BadRequestException('Cannot cancel a purchase order that has already been received');
    }

    if (purchaseOrder.status === PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException('Purchase order is already cancelled');
    }

    return this.update(user, id, { status: PurchaseOrderStatus.CANCELLED });
  }

  async remove(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can delete
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to delete purchase orders');
    }

    const purchaseOrder = await this.findOne(user, id);

    // Only allow deletion of DRAFT or CANCELLED orders
    if (purchaseOrder.status !== PurchaseOrderStatus.DRAFT && purchaseOrder.status !== PurchaseOrderStatus.CANCELLED) {
      throw new BadRequestException(
        `Cannot delete purchase order with status ${purchaseOrder.status}. Only DRAFT or CANCELLED orders can be deleted.`
      );
    }

    return this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  private validateStatusTransition(currentStatus: PurchaseOrderStatus, newStatus: PurchaseOrderStatus) {
    const validTransitions: Record<PurchaseOrderStatus, PurchaseOrderStatus[]> = {
      [PurchaseOrderStatus.DRAFT]: [PurchaseOrderStatus.SUBMITTED, PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.SUBMITTED]: [PurchaseOrderStatus.ORDERED, PurchaseOrderStatus.CANCELLED, PurchaseOrderStatus.DRAFT],
      [PurchaseOrderStatus.ORDERED]: [PurchaseOrderStatus.RECEIVED, PurchaseOrderStatus.CANCELLED],
      [PurchaseOrderStatus.RECEIVED]: [], // Cannot transition from RECEIVED
      [PurchaseOrderStatus.CANCELLED]: [], // Cannot transition from CANCELLED
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }
}

