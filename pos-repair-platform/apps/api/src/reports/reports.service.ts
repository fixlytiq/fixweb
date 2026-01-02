import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserPayload } from '../auth/types';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(user: UserPayload, from?: string, to?: string, storeId?: string) {
    const targetStoreId = storeId || user.storeId;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    // Get total revenue from sales
    const sales = await this.prisma.sale.findMany({
      where: {
        storeId: targetStoreId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
        paymentStatus: 'PAID',
      },
    });

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const totalSales = sales.length;

    // Get ticket counts
    const tickets = await this.prisma.ticket.findMany({
      where: {
        storeId: targetStoreId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const openTickets = tickets.filter(t => 
      t.status !== 'COMPLETED' && t.status !== 'CANCELLED'
    ).length;
    const completedTickets = tickets.filter(t => t.status === 'COMPLETED').length;

    // Get low stock items
    const lowStockItems = await this.prisma.stockItem.findMany({
      where: {
        storeId: targetStoreId,
        reorderPoint: {
          not: null,
        },
      },
    });

    const lowStockCount = lowStockItems.filter(
      item => item.quantityOnHand <= (item.reorderPoint || 0)
    ).length;

    // Get labor hours from time clock
    const timeClocks = await this.prisma.timeClock.findMany({
      where: {
        storeId: targetStoreId,
        clockInAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const totalLaborHours = timeClocks.reduce((sum, clock) => {
      if (clock.totalHours) {
        return sum + Number(clock.totalHours);
      }
      return sum;
    }, 0);

    return {
      totalRevenue,
      totalSales,
      openTickets,
      completedTickets,
      lowStockItems: lowStockCount,
      totalLaborHours,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };
  }

  async getSalesReport(user: UserPayload, from?: string, to?: string, storeId?: string) {
    const targetStoreId = storeId || user.storeId;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const sales = await this.prisma.sale.findMany({
      where: {
        storeId: targetStoreId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
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

    const totalRevenue = sales.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const totalSales = sales.length;
    const averageSale = totalSales > 0 ? totalRevenue / totalSales : 0;

    return {
      totalRevenue,
      totalSales,
      averageSale,
      sales,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };
  }

  async getTicketsReport(user: UserPayload, from?: string, to?: string, storeId?: string) {
    const targetStoreId = storeId || user.storeId;
    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const tickets = await this.prisma.ticket.findMany({
      where: {
        storeId: targetStoreId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
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
        Employee: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const totalTickets = tickets.length;
    const completedTickets = tickets.filter(t => t.status === 'COMPLETED').length;

    // Calculate average turnaround time (in hours)
    const completedWithTimes = tickets.filter(t => 
      t.status === 'COMPLETED' && t.startedAt && t.completedAt
    );
    
    let averageTurnaround = 0;
    if (completedWithTimes.length > 0) {
      const totalHours = completedWithTimes.reduce((sum, ticket) => {
        const start = new Date(ticket.startedAt!).getTime();
        const end = new Date(ticket.completedAt!).getTime();
        return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
      }, 0);
      averageTurnaround = totalHours / completedWithTimes.length;
    }

    return {
      totalTickets,
      completedTickets,
      averageTurnaround,
      tickets,
      period: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
      },
    };
  }

  async getInventoryLowReport(user: UserPayload, threshold: number = 10, storeId?: string) {
    const targetStoreId = storeId || user.storeId;

    const allItems = await this.prisma.stockItem.findMany({
      where: {
        storeId: targetStoreId,
      },
      include: {
        Category: true,
      },
    });

    // Filter items that are below reorder point or threshold
    const items = allItems.filter(item => {
      if (item.reorderPoint !== null) {
        return item.quantityOnHand <= item.reorderPoint;
      }
      return item.quantityOnHand <= threshold;
    }).sort((a, b) => a.quantityOnHand - b.quantityOnHand);

    return {
      items,
      threshold,
    };
  }
}

