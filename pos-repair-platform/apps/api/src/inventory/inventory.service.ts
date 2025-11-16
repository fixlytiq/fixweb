import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStockItemDto } from './dto/create-stock-item.dto';
import { UpdateStockItemDto } from './dto/update-stock-item.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createStockItemDto: CreateStockItemDto) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can create inventory');
    }

    const existing = await this.prisma.stockItem.findFirst({
      where: {
        storeId: user.storeId,
        sku: createStockItemDto.sku,
      },
    });

    if (existing) {
      throw new ConflictException(`SKU ${createStockItemDto.sku} already exists in this store`);
    }

    return this.prisma.stockItem.create({
      data: {
        storeId: user.storeId,
        sku: createStockItemDto.sku,
        name: createStockItemDto.name,
        description: createStockItemDto.description,
        unitCost: createStockItemDto.unitCost,
        unitPrice: createStockItemDto.unitPrice,
        reorderPoint: createStockItemDto.reorderPoint,
        quantityOnHand: createStockItemDto.initialQuantity || 0,
      },
    });
  }

  async findAll(user: UserPayload) {
    return this.prisma.stockItem.findMany({
      where: { storeId: user.storeId },
      include: {
        store: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const stockItem = await this.prisma.stockItem.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        store: true,
        stockMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!stockItem) {
      throw new NotFoundException(`Stock item ${id} not found`);
    }

    return stockItem;
  }

  async update(user: UserPayload, id: string, updateStockItemDto: UpdateStockItemDto) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can manage inventory');
    }

    const existing = await this.prisma.stockItem.findFirst({
      where: { id, storeId: user.storeId },
    });

    if (!existing) {
      throw new NotFoundException(`Stock item ${id} not found in your store`);
    }

    const updateData: any = {};

    if (updateStockItemDto.name !== undefined) updateData.name = updateStockItemDto.name;
    if (updateStockItemDto.description !== undefined) updateData.description = updateStockItemDto.description;
    if (updateStockItemDto.unitCost !== undefined) updateData.unitCost = updateStockItemDto.unitCost;
    if (updateStockItemDto.unitPrice !== undefined) updateData.unitPrice = updateStockItemDto.unitPrice;
    if (updateStockItemDto.reorderPoint !== undefined) updateData.reorderPoint = updateStockItemDto.reorderPoint;

    return this.prisma.stockItem.update({
      where: { id },
      data: updateData,
    });
  }

  async adjustStock(user: UserPayload, id: string, adjustStockDto: AdjustStockDto) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can adjust inventory');
    }

    const stockItem = await this.prisma.stockItem.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!stockItem) {
      throw new NotFoundException('Stock item not found');
    }

    // Create stock movement
    await this.prisma.stockMovement.create({
      data: {
        storeId: user.storeId,
        stockItemId: id,
        quantityChange: adjustStockDto.quantityChange,
        reason: adjustStockDto.reason || 'ADJUSTMENT',
        note: adjustStockDto.note,
      },
    });

    // Update quantity on hand
    return this.prisma.stockItem.update({
      where: { id },
      data: {
        quantityOnHand: stockItem.quantityOnHand + adjustStockDto.quantityChange,
      },
    });
  }

  async remove(user: UserPayload, id: string) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can delete inventory');
    }

    const existing = await this.prisma.stockItem.findFirst({
      where: { id, storeId: user.storeId },
    });

    if (!existing) {
      throw new NotFoundException(`Stock item ${id} not found in your store`);
    }

    await this.prisma.stockItem.delete({
      where: { id },
    });

    return { id };
  }
}

