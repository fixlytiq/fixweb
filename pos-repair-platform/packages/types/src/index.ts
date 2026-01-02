// Shared types for the POS Repair Platform

export type StoreRole = 'OWNER' | 'MANAGER' | 'TECHNICIAN' | 'CASHIER' | 'VIEWER';
export type TicketStatus = 'RECEIVED' | 'IN_PROGRESS' | 'AWAITING_PARTS' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'REFUNDED' | 'VOID';

export interface User {
  employeeId: string;
  storeId: string;
  role: StoreRole;
}

export interface Store {
  id: string;
  name: string;
  storeEmail: string;
  storePhone?: string;
  notificationEmail?: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  name: string;
  role: StoreRole;
  storeId: string;
  createdAt?: string;
}

export interface Customer {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  notes?: string;
  createdAt?: string;
}

export interface Ticket {
  id: string;
  storeId: string;
  customerId?: string;
  technicianId?: string;
  title: string;
  description?: string;
  status: TicketStatus;
  estimatedCost?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  technician?: Employee;
  store?: Store;
}

export interface StockItem {
  id: string;
  storeId: string;
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  category?: Category;
  unitCost?: number;
  unitPrice?: number;
  reorderPoint?: number;
  quantityOnHand: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sale {
  id: string;
  storeId: string;
  ticketId?: string;
  customerId?: string;
  paymentStatus: PaymentStatus;
  reference?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  ticket?: Ticket;
}

export interface Refund {
  id: string;
  storeId: string;
  saleId: string;
  refundedById: string;
  amount: number;
  reason?: string;
  refundedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeClock {
  id: string;
  storeId: string;
  employeeId: string;
  clockInAt: string;
  clockOutAt?: string;
  breakStart?: string;
  breakEnd?: string;
  totalHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportSummary {
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

export interface InventoryLowReport {
  items: StockItem[];
  threshold: number;
}

