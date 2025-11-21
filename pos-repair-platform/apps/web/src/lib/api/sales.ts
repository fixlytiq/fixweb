import { apiClient } from '../api-client';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'REFUNDED' | 'VOID';

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
  updatedAt?: string;
  customer?: {
    id: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
  };
}

export const salesApi = {
  /**
   * Get all sales for the current store
   */
  findAll: async (): Promise<Sale[]> => {
    return await apiClient.get<Sale[]>('/sales');
  },

  /**
   * Get a single sale by ID
   */
  findOne: async (id: string): Promise<Sale> => {
    return await apiClient.get<Sale>(`/sales/${id}`);
  },

  /**
   * Get all sales for a specific ticket
   */
  findByTicketId: async (ticketId: string): Promise<Sale[]> => {
    return await apiClient.get<Sale[]>(`/sales?ticketId=${ticketId}`);
  },

  /**
   * Create a new sale
   */
  create: async (data: {
    ticketId?: string;
    customerId?: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentStatus?: PaymentStatus;
    reference?: string;
  }): Promise<Sale> => {
    return await apiClient.post<Sale>('/sales', data);
  },
};

