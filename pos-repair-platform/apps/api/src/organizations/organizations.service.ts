import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateOrganizationDto) {
    const payload: Prisma.OrganizationCreateInput = {
      name: data.name.trim(),
    };

    return this.prisma.organization.create({ data: payload });
  }

  findAll() {
    return this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
    });

    if (!organization) {
      throw new NotFoundException(`Organization ${id} not found`);
    }

    return organization;
  }

  async update(id: string, data: UpdateOrganizationDto) {
    await this.ensureExists(id);
    const payload: Prisma.OrganizationUpdateInput = {};

    if (typeof data.name === 'string') {
      payload.name = data.name.trim();
    }

    return this.prisma.organization.update({
      where: { id },
      data: payload,
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    await this.prisma.organization.delete({
      where: { id },
    });
    return { id };
  }

  private async ensureExists(id: string) {
    const exists = await this.prisma.organization.count({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Organization ${id} not found`);
    }
  }
}
