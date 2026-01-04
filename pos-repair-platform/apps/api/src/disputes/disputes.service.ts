import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDisputeDto } from './dto/create-dispute.dto';
import { UpdateDisputeDto } from './dto/update-dispute.dto';
import { CreateDisputeEvidenceDto } from './dto/create-dispute-evidence.dto';
import { UserPayload } from '../auth/types';
import { StoreRole, DisputeStatus } from '@prisma/client';

@Injectable()
export class DisputesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: UserPayload, createDisputeDto: CreateDisputeDto) {
    // All authenticated users can create disputes
    // Validate ticket if provided
    if (createDisputeDto.ticketId) {
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: createDisputeDto.ticketId,
          storeId: user.storeId,
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${createDisputeDto.ticketId} not found`);
      }
    }

    return this.prisma.dispute.create({
      data: {
        id: crypto.randomUUID(),
        storeId: user.storeId,
        ticketId: createDisputeDto.ticketId || undefined,
        raisedById: createDisputeDto.raisedById || undefined,
        assignedToId: createDisputeDto.assignedToId || undefined,
        status: createDisputeDto.status || DisputeStatus.OPEN,
        summary: createDisputeDto.summary,
        resolution: createDisputeDto.resolution || undefined,
        openedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        DisputeEvidence: true,
        _count: {
          select: {
            DisputeEvidence: true,
          },
        },
      },
    });
  }

  async findAll(user: UserPayload, status?: DisputeStatus, ticketId?: string) {
    const where: any = {
      storeId: user.storeId,
    };

    if (status) {
      where.status = status;
    }

    if (ticketId) {
      where.ticketId = ticketId;
    }

    return this.prisma.dispute.findMany({
      where,
      include: {
        Ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        _count: {
          select: {
            DisputeEvidence: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(user: UserPayload, id: string) {
    const dispute = await this.prisma.dispute.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
      include: {
        Ticket: {
          select: {
            id: true,
            title: true,
            status: true,
            description: true,
          },
        },
        DisputeEvidence: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!dispute) {
      throw new NotFoundException(`Dispute ${id} not found`);
    }

    return dispute;
  }

  async update(user: UserPayload, id: string, updateDisputeDto: UpdateDisputeDto) {
    // Only OWNER and MANAGER can update disputes
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to update disputes');
    }

    const existing = await this.prisma.dispute.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!existing) {
      throw new NotFoundException(`Dispute ${id} not found`);
    }

    // Validate ticket if provided
    if (updateDisputeDto.ticketId) {
      const ticket = await this.prisma.ticket.findFirst({
        where: {
          id: updateDisputeDto.ticketId,
          storeId: user.storeId,
        },
      });

      if (!ticket) {
        throw new NotFoundException(`Ticket ${updateDisputeDto.ticketId} not found`);
      }
    }

    const updateData: any = {};

    if (updateDisputeDto.ticketId !== undefined) {
      updateData.ticketId = updateDisputeDto.ticketId || null;
    }
    if (updateDisputeDto.raisedById !== undefined) {
      updateData.raisedById = updateDisputeDto.raisedById || null;
    }
    if (updateDisputeDto.assignedToId !== undefined) {
      updateData.assignedToId = updateDisputeDto.assignedToId || null;
    }
    if (updateDisputeDto.status !== undefined) {
      updateData.status = updateDisputeDto.status;
      
      // Auto-set resolvedAt when status changes to RESOLVED or DISMISSED
      if (updateDisputeDto.status === DisputeStatus.RESOLVED || updateDisputeDto.status === DisputeStatus.DISMISSED) {
        if (!updateDisputeDto.resolvedAt) {
          updateData.resolvedAt = new Date();
        }
      }
    }
    if (updateDisputeDto.summary !== undefined) {
      updateData.summary = updateDisputeDto.summary;
    }
    if (updateDisputeDto.resolution !== undefined) {
      updateData.resolution = updateDisputeDto.resolution || null;
    }
    if (updateDisputeDto.resolvedAt !== undefined) {
      updateData.resolvedAt = updateDisputeDto.resolvedAt ? new Date(updateDisputeDto.resolvedAt) : null;
    }

    return this.prisma.dispute.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
      include: {
        Ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        DisputeEvidence: true,
        _count: {
          select: {
            DisputeEvidence: true,
          },
        },
      },
    });
  }

  async resolve(user: UserPayload, id: string, resolution: string) {
    // Only OWNER and MANAGER can resolve disputes
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to resolve disputes');
    }

    const dispute = await this.findOne(user, id);

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.DISMISSED) {
      throw new BadRequestException(`Dispute is already ${dispute.status.toLowerCase()}`);
    }

    return this.update(user, id, {
      status: DisputeStatus.RESOLVED,
      resolution,
      resolvedAt: new Date().toISOString(),
    });
  }

  async dismiss(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can dismiss disputes
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to dismiss disputes');
    }

    const dispute = await this.findOne(user, id);

    if (dispute.status === DisputeStatus.RESOLVED || dispute.status === DisputeStatus.DISMISSED) {
      throw new BadRequestException(`Dispute is already ${dispute.status.toLowerCase()}`);
    }

    return this.update(user, id, {
      status: DisputeStatus.DISMISSED,
      resolvedAt: new Date().toISOString(),
    });
  }

  async addEvidence(user: UserPayload, disputeId: string, createEvidenceDto: CreateDisputeEvidenceDto) {
    // All authenticated users can add evidence
    const dispute = await this.findOne(user, disputeId);

    return this.prisma.disputeEvidence.create({
      data: {
        id: crypto.randomUUID(),
        disputeId: dispute.id,
        type: createEvidenceDto.type,
        url: createEvidenceDto.url || undefined,
        description: createEvidenceDto.description || undefined,
      },
    });
  }

  async removeEvidence(user: UserPayload, disputeId: string, evidenceId: string) {
    // Only OWNER and MANAGER can remove evidence
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to remove evidence');
    }

    const dispute = await this.findOne(user, disputeId);

    const evidence = await this.prisma.disputeEvidence.findFirst({
      where: {
        id: evidenceId,
        disputeId: dispute.id,
      },
    });

    if (!evidence) {
      throw new NotFoundException(`Evidence ${evidenceId} not found`);
    }

    return this.prisma.disputeEvidence.delete({
      where: { id: evidenceId },
    });
  }

  async remove(user: UserPayload, id: string) {
    // Only OWNER and MANAGER can delete disputes
    if (user.role !== StoreRole.OWNER && user.role !== StoreRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to delete disputes');
    }

    const dispute = await this.findOne(user, id);

    return this.prisma.dispute.delete({
      where: { id },
    });
  }
}

