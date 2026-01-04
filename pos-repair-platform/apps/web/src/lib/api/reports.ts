import { apiClient } from '../api-client';

export interface SummaryReport {
  totalRevenue: number;
  totalSales: number;
  openTickets: number;
  completedTickets: number;
  lowStockItems: number;
  totalLaborHours: number;
  period: {
    from: string;
    to: string;
  };
}

export interface SalesReport {
  totalRevenue: number;
  totalSales: number;
  averageSale: number;
  sales: Sale[];
  period: {
    from: string;
    to: string;
  };
}

export interface Sale {
  id: string;
  storeId: string;
  customerId?: string;
  ticketId?: string;
  total?: number;
  paymentStatus: string;
  createdAt: string;
  updatedAt: string;
  Customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  Ticket?: {
    id: string;
    title: string;
    status: string;
  };
}

export interface TicketsReport {
  totalTickets: number;
  completedTickets: number;
  averageTurnaround: number;
  tickets: Ticket[];
  period: {
    from: string;
    to: string;
  };
}

export interface Ticket {
  id: string;
  storeId: string;
  customerId?: string;
  technicianId?: string;
  title: string;
  description?: string;
  status: string;
  estimatedCost?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  Customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
  Employee?: {
    id: string;
    name: string;
    role: string;
  };
}

export interface InventoryLowReport {
  items: StockItem[];
  threshold: number;
}

export interface StockItem {
  id: string;
  storeId: string;
  categoryId?: string;
  sku: string;
  name: string;
  description?: string;
  quantityOnHand: number;
  reorderPoint?: number;
  unitPrice?: number;
  createdAt: string;
  updatedAt: string;
  Category?: {
    id: string;
    name: string;
  };
}

export const reportsApi = {
  getSummary: async (from?: string, to?: string, storeId?: string): Promise<SummaryReport> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (storeId) params.storeId = storeId;
    return apiClient.get<SummaryReport>('/reports/summary', params);
  },

  getSalesReport: async (from?: string, to?: string, storeId?: string): Promise<SalesReport> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (storeId) params.storeId = storeId;
    return apiClient.get<SalesReport>('/reports/sales', params);
  },

  getTicketsReport: async (from?: string, to?: string, storeId?: string): Promise<TicketsReport> => {
    const params: Record<string, string> = {};
    if (from) params.from = from;
    if (to) params.to = to;
    if (storeId) params.storeId = storeId;
    return apiClient.get<TicketsReport>('/reports/tickets', params);
  },

  getInventoryLowReport: async (threshold?: number, storeId?: string): Promise<InventoryLowReport> => {
    const params: Record<string, string> = {};
    if (threshold !== undefined) params.threshold = threshold.toString();
    if (storeId) params.storeId = storeId;
    return apiClient.get<InventoryLowReport>('/reports/inventory-low', params);
  },
};

