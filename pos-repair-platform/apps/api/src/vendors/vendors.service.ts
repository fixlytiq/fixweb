import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { UserPayload } from '../auth/types';
import { StoreRole } from '@prisma/client';

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createVendorDto: CreateVendorDto) {
    // Only OWNER and MANAGER can create vendors
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to create vendors');
    }

    // Check if vendor with same name already exists in this store
    const existing = await this.prisma.vendor.findFirst({
      where: {
        storeId: user.storeId,
        name: createVendorDto.name,
      },
    });

    if (existing) {
      throw new BadRequestException(`Vendor with name "${createVendorDto.name}" already exists in this store`);
    }

    return this.prisma.vendor.create({
      data: {
        id: crypto.randomUUID(),
        storeId: user.storeId,
        name: createVendorDto.name,
        contactName: createVendorDto.contactName || undefined,
        email: createVendorDto.email || undefined,
        phone: createVendorDto.phone || undefined,
        website: createVendorDto.website || undefined,
        notes: createVendorDto.notes || undefined,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            PurchaseOrder: true,
          },
        },
      },
    });
  }

  async findAll(user: UserPayload, search?: string) {
    const where: any = {
      storeId: user.storeId,
    };

    // If search term provided, search across name, contactName, email, and phone
    if (search && search.trim()) {
      const searchTerm = search.trim();
      where.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { contactName: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } },
      ];
    }

    return this.prisma.vendor.findMany({
      where,
      include: {
        _count: {
          select: {
            PurchaseOrder: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });
  }

  async findOne(user: UserPayload, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        _count: {
          select: {
            PurchaseOrder: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async update(user: UserPayload, id: string, updateVendorDto: UpdateVendorDto) {
    // Only OWNER and MANAGER can update vendors
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to update vendors');
    }

    // Check if vendor exists and belongs to the store
    const existing = await this.prisma.vendor.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    // If name is being updated, check for duplicates
    if (updateVendorDto.name && updateVendorDto.name !== existing.name) {
      const duplicate = await this.prisma.vendor.findFirst({
        where: {
          storeId: user.storeId,
          name: updateVendorDto.name,
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new BadRequestException(`Vendor with name "${updateVendorDto.name}" already exists in this store`);
      }
    }

    return this.prisma.vendor.update({
      where: { id },
      data: {
        ...updateVendorDto,
        updatedAt: new Date(),
      },
      include: {
        _count: {
          select: {
            PurchaseOrder: true,
          },
        },
      },
    });
  }

  async remove(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can delete vendors
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to delete vendors');
    }

    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        _count: {
          select: {
            PurchaseOrder: true,
          },
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    // Check if vendor has associated purchase orders
    if (vendor._count.PurchaseOrder > 0) {
      throw new BadRequestException(
        `Cannot delete vendor with ${vendor._count.PurchaseOrder} purchase order(s). Please remove or reassign these purchase orders first.`
      );
    }

    return this.prisma.vendor.delete({
      where: { id },
    });
  }
}

