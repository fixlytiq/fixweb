import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Injectable()
export class StoresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createStoreDto: CreateStoreDto) {
    // Only OWNER role can create stores
    if (user.role !== StoreRole.OWNER) {
      throw new ForbiddenException('Only Store Owners can create stores');
    }

    // Get the employee to find the owner
    const employee = await this.prisma.employee.findUnique({
      where: { id: user.employeeId },
      include: { Store: { include: { Owner: true } } },
    });

    if (!employee) {
      throw new NotFoundException('Employee not found');
    }

    const owner = employee.Store.Owner;

    return this.prisma.store.create({
      data: {
        id: crypto.randomUUID(),
        name: createStoreDto.name.trim(),
        storeEmail: createStoreDto.storeEmail,
        timezone: createStoreDto.timezone || 'America/Chicago',
        ownerId: owner.id,
        updatedAt: new Date(),
      },
    });
  }

  async findAll(user: UserPayload) {
    // Users can only see their own store
    const store = await this.prisma.store.findUnique({
      where: { id: user.storeId },
    });

    return store ? [store] : [];
  }

  async findOne(user: UserPayload, id: string) {
    // Users can only access their own store
    if (id !== user.storeId) {
      throw new NotFoundException(`Store ${id} not found`);
    }

    const store = await this.prisma.store.findUnique({
      where: { id },
    });

    if (!store) {
      throw new NotFoundException(`Store ${id} not found`);
    }

    return store;
  }

  async update(user: UserPayload, id: string, updateStoreDto: UpdateStoreDto) {
    // Only OWNER role can update stores
    if (user.role !== StoreRole.OWNER) {
      throw new ForbiddenException('Only Store Owners can update stores');
    }

    // Verify the store matches the user's store
    if (id !== user.storeId) {
      throw new NotFoundException(`Store ${id} not found`);
    }

    const updateData: any = {};

    if (updateStoreDto.name !== undefined) {
      updateData.name = updateStoreDto.name.trim();
    }

    if (updateStoreDto.timezone !== undefined) {
      updateData.timezone = updateStoreDto.timezone;
    }

    return this.prisma.store.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }

  async remove(user: UserPayload, id: string) {
    // Only OWNER role can delete stores
    if (user.role !== StoreRole.OWNER) {
      throw new ForbiddenException('Only Store Owners can delete stores');
    }

    // Verify the store matches the user's store
    if (id !== user.storeId) {
      throw new NotFoundException(`Store ${id} not found`);
    }

    // Check if store has related data
    const relatedDataCount = await this.prisma.$transaction(async (tx) => {
      const [
        stockItemsCount,
        salesCount,
        ticketsCount,
        timeClocksCount,
        refundsCount,
        employeesCount,
      ] = await Promise.all([
        tx.stockItem.count({ where: { storeId: id } }),
        tx.sale.count({ where: { storeId: id } }),
        tx.ticket.count({ where: { storeId: id } }),
        tx.timeClock.count({ where: { storeId: id } }),
        tx.refund.count({ where: { storeId: id } }),
        tx.employee.count({ where: { storeId: id } }),
      ]);

      return {
        stockItems: stockItemsCount,
        sales: salesCount,
        tickets: ticketsCount,
        timeClocks: timeClocksCount,
        refunds: refundsCount,
        employees: employeesCount,
      };
    });

    // Delete all related data before deleting the store
    await this.prisma.$transaction(async (tx) => {
      // 1. Delete stock movements
      await tx.stockMovement.deleteMany({
        where: { storeId: id },
      });

      // 2. Delete stock items
      await tx.stockItem.deleteMany({
        where: { storeId: id },
      });

      // 3. Delete refunds
      await tx.refund.deleteMany({
        where: { storeId: id },
      });

      // 4. Delete time clocks
      await tx.timeClock.deleteMany({
        where: { storeId: id },
      });

      // 5. Delete sales
      await tx.sale.deleteMany({
        where: { storeId: id },
      });

      // 6. Delete tickets
      await tx.ticket.deleteMany({
        where: { storeId: id },
      });

      // 7. Delete purchase orders
      await tx.purchaseOrder.deleteMany({
        where: { storeId: id },
      });

      // 8. Delete disputes
      await tx.dispute.deleteMany({
        where: { storeId: id },
      });

      // 9. Delete employees (cascade should handle this, but being explicit)
      await tx.employee.deleteMany({
        where: { storeId: id },
      });

      // 10. Finally, delete the store itself
      await tx.store.delete({
        where: { id },
      });
    });

    return { id };
  }
}
