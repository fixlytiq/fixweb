import { apiClient } from './api-client';
import type {
  Store,
  Employee,
  Ticket,
  StockItem,
  Category,
  Sale,
  Refund,
  TimeClock,
  ReportSummary,
  SalesReport,
  TicketsReport,
  InventoryLowReport,
  TicketStatus,
  PaymentStatus,
  Notification,
  Customer,
} from './types';

// Auth API
export const authApi = {
  login: async (storeEmail: string, pin: string) => {
    return apiClient.post<{ token: string; user: { employeeId: string; storeId: string; role: string } }>('/auth/login', {
      storeEmail,
      pin,
    });
  },
};

// Stores API
export const storesApi = {
  findAll: async (): Promise<Store[]> => {
    return apiClient.get<Store[]>('/stores');
  },
  findOne: async (id: string): Promise<Store> => {
    return apiClient.get<Store>(`/stores/${id}`);
  },
  create: async (data: { name: string; storeEmail: string; storePhone?: string; notificationEmail?: string; timezone?: string }): Promise<Store> => {
    return apiClient.post<Store>('/stores', data);
  },
  update: async (id: string, data: Partial<Store>): Promise<Store> => {
    return apiClient.patch<Store>(`/stores/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/stores/${id}`);
  },
};

// Employees API
export const employeesApi = {
  findAll: async (): Promise<Employee[]> => {
    return apiClient.get<Employee[]>('/employees');
  },
  findOne: async (id: string): Promise<Employee> => {
    return apiClient.get<Employee>(`/employees/${id}`);
  },
  create: async (data: { name: string; pin: string; role: string }): Promise<Employee> => {
    return apiClient.post<Employee>('/employees', data);
  },
  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    return apiClient.patch<Employee>(`/employees/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/employees/${id}`);
  },
};

// Tickets API
export const ticketsApi = {
  findAll: async (status?: TicketStatus, technicianId?: string): Promise<Ticket[]> => {
    const params: Record<string, string> = {};
    if (status) params.status = status;
    if (technicianId) params.technicianId = technicianId;
    return apiClient.get<Ticket[]>('/tickets', params);
  },
  findOne: async (id: string): Promise<Ticket> => {
    return apiClient.get<Ticket>(`/tickets/${id}`);
  },
  create: async (data: Partial<Ticket>): Promise<Ticket> => {
    return apiClient.post<Ticket>('/tickets', data);
  },
  update: async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
    return apiClient.patch<Ticket>(`/tickets/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/tickets/${id}`);
  },
  addNote: async (ticketId: string, body: string, visibility: 'INTERNAL' | 'CUSTOMER' = 'INTERNAL') => {
    return apiClient.post(`/tickets/${ticketId}/notes`, { body, visibility });
  },
  getNotes: async (ticketId: string) => {
    return apiClient.get(`/tickets/${ticketId}/notes`);
  },
};

// Inventory API
export const inventoryApi = {
  findAll: async (categoryId?: string): Promise<StockItem[]> => {
    return apiClient.get<StockItem[]>('/inventory', categoryId ? { categoryId } : undefined);
  },
  findOne: async (id: string): Promise<StockItem> => {
    return apiClient.get<StockItem>(`/inventory/${id}`);
  },
  create: async (data: Partial<StockItem>): Promise<StockItem> => {
    return apiClient.post<StockItem>('/inventory', data);
  },
  update: async (id: string, data: Partial<StockItem>): Promise<StockItem> => {
    return apiClient.patch<StockItem>(`/inventory/${id}`, data);
  },
  adjustStock: async (id: string, quantityChange: number, reason?: string, note?: string) => {
    return apiClient.post<StockItem>(`/inventory/${id}/adjust`, { quantityChange, reason, note });
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/inventory/${id}`);
  },
};

// Categories API
export const categoriesApi = {
  findAll: async (): Promise<Category[]> => {
    return apiClient.get<Category[]>('/categories');
  },
  findOne: async (id: string): Promise<Category> => {
    return apiClient.get<Category>(`/categories/${id}`);
  },
  create: async (data: { name: string; description?: string }): Promise<Category> => {
    return apiClient.post<Category>('/categories', data);
  },
  update: async (id: string, data: Partial<Category>): Promise<Category> => {
    return apiClient.patch<Category>(`/categories/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/categories/${id}`);
  },
};

// Sales API
export const salesApi = {
  findAll: async (ticketId?: string): Promise<Sale[]> => {
    return apiClient.get<Sale[]>('/sales', ticketId ? { ticketId } : undefined);
  },
  findOne: async (id: string): Promise<Sale> => {
    return apiClient.get<Sale>(`/sales/${id}`);
  },
  create: async (data: Partial<Sale>): Promise<Sale> => {
    return apiClient.post<Sale>('/sales', data);
  },
};

// Refunds API
export const refundsApi = {
  findAll: async (): Promise<Refund[]> => {
    return apiClient.get<Refund[]>('/refunds');
  },
  findOne: async (id: string): Promise<Refund> => {
    return apiClient.get<Refund>(`/refunds/${id}`);
  },
  create: async (data: { saleId: string; amount: number; reason?: string }): Promise<Refund> => {
    return apiClient.post<Refund>('/refunds', data);
  },
};

// Time Clock API
export const timeClockApi = {
  findAll: async (): Promise<TimeClock[]> => {
    return apiClient.get<TimeClock[]>('/time-clock');
  },
  findOne: async (id: string): Promise<TimeClock> => {
    return apiClient.get<TimeClock>(`/time-clock/${id}`);
  },
  clockIn: async () => {
    return apiClient.post<TimeClock>('/time-clock/clock-in', {});
  },
  clockOut: async () => {
    return apiClient.post<TimeClock>('/time-clock/clock-out', {});
  },
};

// Reports API
export const reportsApi = {
  summary: async (from?: string, to?: string, storeId?: string): Promise<ReportSummary> => {
    return apiClient.get<ReportSummary>('/reports/summary', { from, to, storeId } as any);
  },
  sales: async (from?: string, to?: string, storeId?: string): Promise<SalesReport> => {
    return apiClient.get<SalesReport>('/reports/sales', { from, to, storeId } as any);
  },
  tickets: async (from?: string, to?: string, storeId?: string): Promise<TicketsReport> => {
    return apiClient.get<TicketsReport>('/reports/tickets', { from, to, storeId } as any);
  },
  inventoryLow: async (threshold?: number, storeId?: string): Promise<InventoryLowReport> => {
    return apiClient.get<InventoryLowReport>('/reports/inventory-low', { threshold, storeId } as any);
  },
};

// Notifications API
export const notificationsApi = {
  findAll: async (read?: boolean, limit?: number): Promise<Notification[]> => {
    const params: Record<string, string> = {};
    if (read !== undefined) params.read = read.toString();
    if (limit) params.limit = limit.toString();
    return apiClient.get<Notification[]>('/notifications', params);
  },
  getUnreadCount: async (): Promise<{ count: number }> => {
    return apiClient.get<{ count: number }>('/notifications/unread-count');
  },
  markAsRead: async (id: string): Promise<Notification> => {
    return apiClient.patch<Notification>(`/notifications/${id}/read`, {});
  },
  markAllAsRead: async (): Promise<{ updated: number }> => {
    return apiClient.patch<{ updated: number }>('/notifications/read-all', {});
  },
};

// Customers API
export const customersApi = {
  findAll: async (search?: string, limit?: number): Promise<Customer[]> => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (limit) params.limit = limit.toString();
    return apiClient.get<Customer[]>('/customers', params);
  },
  findOne: async (id: string): Promise<Customer> => {
    return apiClient.get<Customer>(`/customers/${id}`);
  },
  create: async (data: { firstName?: string; lastName?: string; email?: string; phone?: string; notes?: string }): Promise<Customer> => {
    return apiClient.post<Customer>('/customers', data);
  },
  update: async (id: string, data: Partial<Customer>): Promise<Customer> => {
    return apiClient.patch<Customer>(`/customers/${id}`, data);
  },
  remove: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/customers/${id}`);
  },
};

