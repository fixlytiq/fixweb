import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayload } from '../auth/types';
import { NotificationType, NotificationChannel } from '@prisma/client';

@Injectable()
export class NotificationHistoryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    user: UserPayload,
    read?: boolean,
    limit: number = 50,
  ) {
    const where: any = {
      storeId: user.storeId,
    };

    if (read !== undefined) {
      where.read = read;
    }

    return this.prisma.notificationHistory.findMany({
      where,
      include: {
        Ticket: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        Sale: {
          select: {
            id: true,
            total: true,
            paymentStatus: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
      take: limit,
    });
  }

  async getUnreadCount(user: UserPayload) {
    const count = await this.prisma.notificationHistory.count({
      where: {
        storeId: user.storeId,
        read: false,
      },
    });

    return { count };
  }

  async markAsRead(user: UserPayload, id: string) {
    const notification = await this.prisma.notificationHistory.findFirst({
      where: {
        id,
        storeId: user.storeId,
      },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.prisma.notificationHistory.update({
      where: { id },
      data: {
        read: true,
        readAt: new Date(),
      },
    });
  }

  async markAllAsRead(user: UserPayload) {
    const result = await this.prisma.notificationHistory.updateMany({
      where: {
        storeId: user.storeId,
        read: false,
      },
      data: {
        read: true,
        readAt: new Date(),
      },
    });

    return { updated: result.count };
  }

  async create(
    storeId: string,
    data: {
      type: NotificationType;
      channel: NotificationChannel;
      title: string;
      message: string;
      recipient?: string;
      ticketId?: string;
      saleId?: string;
    },
  ) {
    return this.prisma.notificationHistory.create({
      data: {
        id: crypto.randomUUID(),
        storeId,
        ...data,
      },
    });
  }
}

