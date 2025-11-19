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

    // Validate category - it's required
    const category = await this.prisma.category.findFirst({
      where: {
        id: createStockItemDto.categoryId,
        storeId: user.storeId,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${createStockItemDto.categoryId} not found in your store`);
    }

    return this.prisma.stockItem.create({
      data: {
        id: crypto.randomUUID(),
        storeId: user.storeId,
        sku: createStockItemDto.sku,
        name: createStockItemDto.name,
        description: createStockItemDto.description,
        categoryId: createStockItemDto.categoryId,
        unitCost: createStockItemDto.unitCost,
        unitPrice: createStockItemDto.unitPrice,
        reorderPoint: createStockItemDto.reorderPoint,
        quantityOnHand: createStockItemDto.initialQuantity || 0,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
      },
    });
  }

  async findAll(user: UserPayload, categoryId?: string) {
    const where: any = { storeId: user.storeId };
    
    if (categoryId) {
      where.categoryId = categoryId;
    }

    return this.prisma.stockItem.findMany({
      where,
      include: {
        Store: true,
        Category: true,
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
        Store: true,
        Category: true,
        StockMovement: {
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

    // Validate category if provided
    if (updateStockItemDto.categoryId !== undefined) {
      if (updateStockItemDto.categoryId) {
        const category = await this.prisma.category.findFirst({
          where: {
            id: updateStockItemDto.categoryId,
            storeId: user.storeId,
          },
        });

        if (!category) {
          throw new NotFoundException(`Category ${updateStockItemDto.categoryId} not found in your store`);
        }
      }
    }

    const updateData: any = {};

    if (updateStockItemDto.name !== undefined) updateData.name = updateStockItemDto.name;
    if (updateStockItemDto.description !== undefined) updateData.description = updateStockItemDto.description;
    if (updateStockItemDto.categoryId !== undefined) {
      updateData.categoryId = updateStockItemDto.categoryId || null;
    }
    if (updateStockItemDto.unitCost !== undefined) updateData.unitCost = updateStockItemDto.unitCost;
    if (updateStockItemDto.unitPrice !== undefined) updateData.unitPrice = updateStockItemDto.unitPrice;
    if (updateStockItemDto.reorderPoint !== undefined) updateData.reorderPoint = updateStockItemDto.reorderPoint;
    if (updateStockItemDto.quantityOnHand !== undefined) updateData.quantityOnHand = updateStockItemDto.quantityOnHand;

    return this.prisma.stockItem.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        Category: true,
      },
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
        id: crypto.randomUUID(),
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

