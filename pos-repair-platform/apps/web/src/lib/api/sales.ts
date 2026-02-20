import { apiClient } from '../api-client';

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'REFUNDED' | 'VOID' | 'FAILED';

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
   * Create a new sale (with optional line items; inventory is deducted when payment succeeds).
   * - CASH: sale created as PAID and inventory deducted immediately.
   * - CARD: sale created as PENDING, then provider capture; on success sale set to PAID and inventory deducted. Requires idempotencyKey to avoid double charge.
   */
  create: async (data: {
    ticketId?: string;
    customerId?: string;
    subtotal: number;
    tax: number;
    total: number;
    paymentStatus?: PaymentStatus;
    reference?: string;
    lineItems?: {
      stockItemId?: string;
      description: string;
      quantity: number;
      unitPrice: number;
    }[];
    /** CASH = immediate PAID. CARD = confirm via provider (requires idempotencyKey). */
    paymentMethod?: 'CASH' | 'CARD';
    /** Required for CARD. Unique per attempt (e.g. one per modal open). */
    idempotencyKey?: string;
    /** Provider token (e.g. Stripe). Never send raw card data (PCI). */
    paymentToken?: string;
  }): Promise<Sale> => {
    return await apiClient.post<Sale>('/sales', data);
  },
};

