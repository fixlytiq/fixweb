import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createCategoryDto: CreateCategoryDto) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can create categories');
    }

    // Check if category with same name already exists in this store
    const existing = await this.prisma.category.findFirst({
      where: {
        storeId: user.storeId,
        name: createCategoryDto.name,
      },
    });

    if (existing) {
      throw new ConflictException(`Category "${createCategoryDto.name}" already exists in this store`);
    }

    return this.prisma.category.create({
      data: {
        id: crypto.randomUUID(),
        storeId: user.storeId,
        name: createCategoryDto.name,
        description: createCategoryDto.description,
        updatedAt: new Date(),
      },
    });
  }

  async findAll(user: UserPayload) {
    return this.prisma.category.findMany({
      where: { storeId: user.storeId },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async findOneWithItems(user: UserPayload, id: string) {
    const category = await this.prisma.category.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        StockItem: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category ${id} not found`);
    }

    return category;
  }

  async update(user: UserPayload, id: string, updateCategoryDto: UpdateCategoryDto) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can update categories');
    }

    const existing = await this.prisma.category.findFirst({
      where: { id, storeId: user.storeId },
    });

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found in your store`);
    }

    // Check if new name conflicts with another category
    if (updateCategoryDto.name && updateCategoryDto.name !== existing.name) {
      const nameConflict = await this.prisma.category.findFirst({
        where: {
          storeId: user.storeId,
          name: updateCategoryDto.name,
          id: { not: id },
        },
      });

      if (nameConflict) {
        throw new ConflictException(`Category "${updateCategoryDto.name}" already exists in this store`);
      }
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...updateCategoryDto,
        updatedAt: new Date(),
      },
    });
  }

  async remove(user: UserPayload, id: string) {
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('Only Store Owners and Managers can delete categories');
    }

    const existing = await this.prisma.category.findFirst({
      where: { id, storeId: user.storeId },
      include: {
        StockItem: {
          take: 1,
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(`Category ${id} not found in your store`);
    }

    // Check if category is being used by any stock items
    if (existing.StockItem && existing.StockItem.length > 0) {
      throw new ConflictException(
        `Cannot delete category "${existing.name}" because it is being used by ${existing.StockItem.length} or more inventory items. Please reassign or remove those items first.`
      );
    }

    await this.prisma.category.delete({
      where: { id },
    });

    return { id };
  }
}

